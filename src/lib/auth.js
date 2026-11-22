// Supabase accounts (email + password) and cabinet sync.
// The publishable key is public by design; row-level security limits every row to its owner.
import { createClient } from '@supabase/supabase-js';
import { setRemote } from './cabinet.js';

const URL = 'https://uvlmdsqvybxmdayjngrt.supabase.co';
const KEY = 'sb_publishable_qad4MdwbYSKOU-SXAafvQQ_O-Mhdgxo';

export const supabase = createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true } });
export const isConfigured = () => true;

let user = null;
const listeners = new Set();
export const currentUser = () => user;
export const onUser = (fn) => (listeners.add(fn), () => listeners.delete(fn));
const setUser = (u) => { user = u; listeners.forEach((fn) => fn(u)); };

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + '/#/app/today' } });
  if (error) throw error;
  return { needsConfirm: !data.session };
}
export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}
export async function signOut() {
  await supabase.auth.signOut();
}

// ---- sync: local cabinet <-> cabinet_items + dose_log ----
const row = (it) => ({
  generic: (it.generic || it.name).toLowerCase(), name: it.name, strength: it.strength ?? it.dose ?? '',
  route: it.route ?? null, slots: it.slots ?? [], with_food: it.withFood ?? 'any',
  pills_left: Number.isFinite(Number(it.pillsLeft)) ? Math.round(Number(it.pillsLeft)) : null,
  per_day: Number(it.perDay) || null, recap: it.recap ?? {}, scanned_at: it.scannedAt ?? new Date().toISOString(),
  updated_at: new Date().toISOString(),
});
const k = (g, s) => `${String(g).toLowerCase()}|${s ?? ''}`;

async function pull() {
  const [{ data: items, error: e1 }, { data: doses, error: e2 }] = await Promise.all([
    supabase.from('cabinet_items').select('*'),
    supabase.from('dose_log').select('item_id, day, slot'),
  ]);
  if (e1 || e2) throw e1 || e2;
  const taken = {};
  for (const d of doses) (taken[d.day] ??= []).push(`${d.item_id}|${d.slot}`);
  return {
    items: items.map((r) => ({ id: r.id, name: r.name, generic: r.generic, strength: r.strength, route: r.route, slots: r.slots,
      withFood: r.with_food, pillsLeft: r.pills_left, perDay: Number(r.per_day) || r.slots.length, recap: r.recap, scannedAt: r.scanned_at })),
    taken,
  };
}

let pushing = Promise.resolve();
function push(state) {
  // ponytail: full-state upsert per write; fine for a personal cabinet (tens of rows), diff-based sync if it grows.
  pushing = pushing.then(async () => {
    const { data: saved, error } = await supabase.from('cabinet_items')
      .upsert(state.items.map(row), { onConflict: 'user_id,generic,strength' }).select('id, generic, strength');
    if (error) throw error;
    const idOf = new Map(saved.map((r) => [k(r.generic, r.strength), r.id]));
    const map = new Map(state.items.map((it) => [it.id, idOf.get(k(it.generic || it.name, it.strength ?? it.dose ?? ''))]));
    const keep = saved.map((r) => r.id);
    if (keep.length) await supabase.from('cabinet_items').delete().not('id', 'in', `(${keep.join(',')})`);
    else await supabase.from('cabinet_items').delete().not('id', 'is', null);
    const doses = Object.entries(state.taken).flatMap(([day, arr]) => arr.map((t) => {
      const i = t.lastIndexOf('|');
      return { item_id: map.get(t.slice(0, i)), day, slot: t.slice(i + 1) };
    })).filter((d) => d.item_id);
    if (doses.length) await supabase.from('dose_log').upsert(doses, { onConflict: 'item_id,day,slot', ignoreDuplicates: true });
  }).catch((e) => console.warn('MedLens sync failed; kept locally.', e.message));
  return pushing;
}

async function attach(u) {
  setUser(u);
  if (!u) return setRemote(null);
  // First sign-in on this device: upload what the guest already saved, then adopt the server copy.
  const { getSnapshot } = await import('./cabinet.js');
  const local = getSnapshot();
  if (local.items.length) await push(local);
  await setRemote({ push, pull });
}

supabase.auth.getSession().then(({ data }) => attach(data.session?.user ?? null));
supabase.auth.onAuthStateChange((_e, session) => {
  if ((session?.user?.id ?? null) !== (user?.id ?? null)) attach(session?.user ?? null);
});
