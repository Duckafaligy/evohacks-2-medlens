// App-level glue between the data modules and the UI (no React here).
import * as cabinet from './cabinet.js';
import { getRecap } from './openfda.js';
import { parseLine } from './parse.js';
import { SCENARIOS } from '../data/scenarios.js';
import { SLOT_TIMES } from './ics.js';
import { STRINGS } from '../data/i18n.js';

export const SLOTS = ['morning', 'noon', 'evening', 'bedtime'];
export { SLOT_TIMES };

/** Text in the current language: plain strings pass through; {en,es,fr,zh} picks lang, then en. */
export const pl = (v, lang) => (v == null ? '' : typeof v === 'string' ? v : v[lang] || v.en || '');

const isLiquid = (dose) => /ml/i.test(dose || '');

/** Add meds to the cabinet now, then fill in label recaps in the background. */
export function addToCabinet(meds) {
  const saved = meds.map((m) =>
    cabinet.upsert({
      ...m,
      strength: m.strength ?? m.dose,
      pillsLeft: m.pillsLeft ?? (m.prn || isLiquid(m.dose) ? null : (m.slots?.length || 1) * 30),
    }));
  for (const s of saved) {
    if (!s.generic || s.recap) continue;
    getRecap(s.generic)
      .then((recap) => {
        if (cabinet.list().some((i) => i.id === s.id)) cabinet.upsert({ generic: s.generic, strength: s.strength, recap });
      })
      .catch(() => {});
  }
  return saved;
}

/** Replace the cabinet with an example scenario. Returns its raw note text. */
export function loadExample(id) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  cabinet.clear();
  addToCabinet(sc.meds.map((m) => ({ ...m, ex: `${sc.id}:${m.id}` })));
  return sc.raw;
}

// ---- share plan (compact so the fridge-card QR stays scannable) ----
export const planOf = (items) => ({
  v: 1,
  m: items.map((i) => (i.ex ? { ex: i.ex } : { raw: i.raw || `${i.name} ${i.strength}` })),
});

export function restorePlan(plan) {
  if (!plan || !Array.isArray(plan.m)) return false;
  const meds = plan.m.map((p) => {
    if (p.ex) {
      const [sid, mid] = p.ex.split(':');
      const med = SCENARIOS.find((s) => s.id === sid)?.meds.find((m) => m.id === mid);
      return med ? { ...med, ex: p.ex } : null;
    }
    return p.raw ? parseLine(p.raw) : null;
  }).filter(Boolean);
  if (!meds.length) return false;
  cabinet.clear();
  addToCabinet(meds);
  return true;
}

/** Minutes until the next untaken dose today: { slot, minutes, meds } or null. */
export function nextDose(items, taken, now = new Date()) {
  const mins = now.getHours() * 60 + now.getMinutes();
  for (const slot of SLOTS) {
    const [h, m] = SLOT_TIMES[slot].split(':').map(Number);
    const at = h * 60 + m;
    const due = items.filter((i) => i.slots?.includes(slot) && !taken.some((t) => t.id === i.id && t.slot === slot));
    if (at >= mins && due.length) return { slot, minutes: at - mins, meds: due };
  }
  return null;
}

/** 12h clock label for a slot ("8:00 AM"). */
export function slotTime(slot) {
  const [h, m] = SLOT_TIMES[slot].split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** Everything a caregiver needs to hear, in their language. */
export function scheduleSpeech(items, lang) {
  const S = STRINGS[lang] || STRINGS.en;
  if (!items.length) return S.emptyTitle;
  const parts = [];
  for (const slot of SLOTS) {
    const due = items.filter((i) => i.slots?.includes(slot));
    if (due.length) parts.push(`${S[slot]}: ${due.map((i) => pl(i.plain, lang) || `${i.name} ${i.strength}`).join(' ')}`);
  }
  const prn = items.filter((i) => i.prn);
  if (prn.length) parts.push(`${S.asNeeded}: ${prn.map((i) => pl(i.plain, lang)).join(' ')}`);
  return parts.join('. ');
}

export const localDay = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** One stable colour per medicine, shared by Today and Calendar. */
export const MED_COLORS = ['#1849A9', '#0E6A80', '#12704F', '#46536A', '#7A3FA0', '#A14A06'];
const SOFT = { '#1849A9': '#E8EFFB', '#0E6A80': '#E2F2F5', '#12704F': '#E5F3EC', '#46536A': '#ECEFF3', '#7A3FA0': '#F1E9F6', '#A14A06': '#FDF0E1' };
/** Tinted background that goes with a med colour. */
export const softFor = (c) => SOFT[c] || '#ECEFF3';
export const colorFor = (items, id) => MED_COLORS[Math.max(0, items.findIndex((i) => i.id === id)) % MED_COLORS.length];

/** Is this med scheduled on `day` (YYYY-MM-DD)? Short courses run `days` days from when they were added. */
export function activeOn(m, day) {
  const start = localDay(new Date(m.scannedAt || Date.now()));
  if (day < start) return false;
  if (!m.days) return true;
  const end = new Date(`${start}T12:00`);
  end.setDate(end.getDate() + m.days - 1);
  return day <= localDay(end);
}

/** Minutes since midnight for a slot. */
export const slotMinutes = (slot) => {
  const [h, m] = SLOT_TIMES[slot].split(':').map(Number);
  return h * 60 + m;
};
