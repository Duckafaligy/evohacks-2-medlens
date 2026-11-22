// RLS smoke test: two throwaway users; B must not see A's medicine. Usage: node tools/rls-check.mjs <publishableKey>
import { createClient } from '@supabase/supabase-js';
import assert from 'node:assert';
const URL = 'https://uvlmdsqvybxmdayjngrt.supabase.co', KEY = process.argv[2];
const mk = async (tag) => {
  const c = createClient(URL, KEY, { auth: { persistSession: false } });
  const { data, error } = await c.auth.signUp({ email: `rlscheck-${tag}-${Date.now()}@medlens-test.dev`, password: 'Test-pass-1234' });
  if (error) throw error; assert(data.session, 'no session (confirmations on?)'); return c;
};
const A = await mk('a'), B = await mk('b');
const ins = await A.from('cabinet_items').insert({ generic: 'warfarin', name: 'Warfarin', strength: '5 mg', slots: ['evening'] }).select().single();
assert(!ins.error, ins.error?.message);
assert.equal((await A.from('cabinet_items').select()).data.length, 1);
assert.equal((await B.from('cabinet_items').select()).data.length, 0, 'B can see A rows!');
const bad = await B.from('dose_log').insert({ item_id: ins.data.id, day: '2026-11-22', slot: 'evening' });
assert(bad.error, 'B logged a dose on A item!');
const anon = createClient(URL, KEY);
const an = await anon.from('cabinet_items').select();
assert(an.error || an.data.length === 0, 'anon can read!');
console.log('RLS OK');
