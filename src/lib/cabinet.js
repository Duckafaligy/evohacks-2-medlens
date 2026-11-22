// Local-first medicine cabinet (localStorage 'medlens.cabinet.v1').
// React: useSyncExternalStore(subscribe, getSnapshot) — the snapshot object only changes on writes.
//
// Item: { id, name, generic, strength, route, slots[], withFood, pillsLeft, perDay, refillDate,
//         recap: { activeIngredients, purpose, howToTake, warnings, sideEffects, source }, scannedAt, lastScanned }
// State: { items: Item[], taken: { 'YYYY-MM-DD': ['<id>|<slot>', ...] }, at: { 'YYYY-MM-DD|<id>|<slot>': ISO time } }

const KEY = 'medlens.cabinet.v1';
const EMPTY = { items: [], taken: {}, at: {} };
const listeners = new Set();
let remote = null;
let memory = null; // used when localStorage is unavailable (private mode, Node)

function storage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function load() {
  try {
    const raw = storage()?.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return { items: Array.isArray(s.items) ? s.items : [], taken: s.taken && typeof s.taken === 'object' ? s.taken : {}, at: s.at && typeof s.at === 'object' ? s.at : {} };
    }
  } catch { /* corrupt or blocked -> start empty */ }
  return memory ?? EMPTY;
}

let state = load();

function commit(next) {
  state = next;
  memory = next;
  try { storage()?.setItem(KEY, JSON.stringify(next)); } catch { /* quota/blocked: keep in memory */ }
  if (remote?.push) Promise.resolve().then(() => remote.push(next)).catch(() => {});
  listeners.forEach((fn) => fn());
}

const norm = (s) => String(s ?? '').toLowerCase().replace(/\s+/g, '').trim();
const keyOf = (m) => `${norm(m.generic || m.name)}|${norm(m.strength ?? m.dose)}`;
const today = () => new Date().toISOString().slice(0, 10);

// Day the supply runs out, from pillsLeft / perDay (perDay defaults to number of daily slots).
function withRefill(item) {
  const perDay = Number(item.perDay) || item.slots?.length || 0;
  let refillDate = null;
  if (perDay > 0 && Number.isFinite(Number(item.pillsLeft))) {
    const d = new Date();
    d.setDate(d.getDate() + Math.floor(Number(item.pillsLeft) / perDay));
    refillDate = d.toISOString().slice(0, 10);
  }
  return { ...item, perDay, refillDate };
}

export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
export const getSnapshot = () => state;
export const list = () => state.items;

/**
 * upsert(med) -> saved item. Same generic + strength already in the cabinet: adds pillsLeft
 * to the existing count and updates lastScanned / recap instead of making a duplicate.
 */
export function upsert(med) {
  const now = new Date().toISOString();
  const k = keyOf(med);
  const existing = state.items.find((i) => keyOf(i) === k);
  let saved;
  if (existing) {
    saved = withRefill({
      ...existing,
      pillsLeft: (Number(existing.pillsLeft) || 0) + (Number(med.pillsLeft) || 0),
      recap: med.recap ?? existing.recap,
      plain: med.plain ?? existing.plain,
      purpose: med.purpose ?? existing.purpose,
      slots: med.slots?.length ? med.slots : existing.slots,
      lastScanned: now,
    });
    commit({ ...state, items: state.items.map((i) => (i.id === existing.id ? saved : i)) });
  } else {
    saved = withRefill({
      ...med, // keeps extra fields (plain, purpose, prn, days, water, ex, raw)
      id: med.id && !state.items.some((i) => i.id === med.id) ? med.id : `${norm(med.generic || med.name)}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      name: med.name || med.generic || '',
      generic: (med.generic || '').toLowerCase(),
      strength: med.strength ?? med.dose ?? '',
      route: med.route ?? 'PO',
      slots: med.slots ?? [],
      withFood: med.withFood ?? 'any',
      pillsLeft: med.pillsLeft ?? null,
      perDay: med.perDay,
      recap: med.recap ?? null,
      scannedAt: med.scannedAt ?? now,
      lastScanned: now,
    });
    commit({ ...state, items: [...state.items, saved] });
  }
  return saved;
}

export function remove(id) {
  commit({ ...state, items: state.items.filter((i) => i.id !== id) });
}

/** markTaken(id, '2026-11-22', 'morning', taken = true) — toggles a dose; 1 pill per dose off pillsLeft. */
export function markTaken(id, dateISO = today(), slot, taken = true) {
  const day = dateISO.slice(0, 10);
  const tag = `${id}|${slot}`;
  const cur = state.taken[day] ?? [];
  if (taken === cur.includes(tag)) return;
  const delta = taken ? -1 : 1; // ponytail: assumes 1 unit per dose; liquids need a per-dose amount
  commit({
    items: state.items.map((i) =>
      i.id === id && Number.isFinite(Number(i.pillsLeft)) && i.pillsLeft !== null
        ? withRefill({ ...i, pillsLeft: Math.max(0, Number(i.pillsLeft) + delta) })
        : i),
    taken: { ...state.taken, [day]: taken ? [...cur, tag] : cur.filter((x) => x !== tag) },
    at: { ...(state.at || {}), [`${day}|${tag}`]: taken ? new Date().toISOString() : undefined },
  });
}

/** takenOn('2026-11-22') -> [{ id, slot, at }]  (at = ISO time it was marked, if known) */
export function takenOn(dateISO = today()) {
  const day = dateISO.slice(0, 10);
  return (state.taken[day] ?? []).map((t) => {
    const i = t.lastIndexOf('|');
    return { id: t.slice(0, i), slot: t.slice(i + 1), at: state.at?.[`${day}|${t}`] || null };
  });
}

/**
 * setRemote({ push(state), pull?() }) — optional sync hook (e.g. Supabase later).
 * push runs after every local write; pull (if given) replaces local state once, now.
 */
export async function setRemote(adapter) {
  remote = adapter || null;
  if (remote?.pull) {
    try {
      const s = await remote.pull();
      if (s && Array.isArray(s.items)) commit({ items: s.items, taken: s.taken || {}, at: s.at || {} });
    } catch { /* offline: keep local */ }
  }
}

/** clear() — empties the cabinet (for demos/tests). */
export const clear = () => commit(EMPTY);
