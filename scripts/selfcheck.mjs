// node scripts/selfcheck.mjs [--live]
import assert from 'node:assert/strict';
import { parseLine, parseText, highlightTerms } from '../src/lib/parse.js';
import { buildIcs, googleCalendarUrl } from '../src/lib/ics.js';
import * as cabinet from '../src/lib/cabinet.js';
import { checkInteractions, getLabel } from '../src/lib/openfda.js';
import { SCENARIOS } from '../src/data/scenarios.js';
import { GLOSSARY } from '../src/data/glossary.js';
import { STRINGS, t } from '../src/data/i18n.js';
import { REDFLAGS } from '../src/data/redflags.js';
import { fkGrade } from '../src/lib/readability.js';
import { encodePlan, decodePlan } from '../src/lib/share.js';

const LANGS = ['en', 'es', 'fr', 'zh'];

// parse
const m = parseLine('Metoprolol 25 mg PO BID');
assert.equal(m.name, 'Metoprolol');
assert.equal(m.dose, '25 mg');
assert.equal(m.route, 'PO');
assert.deepEqual(m.slots, ['morning', 'evening']);
assert.equal(m.prn, false);
assert.match(m.plain, /2 times a day/);
assert.equal(parseLine('Cephalexin 500 mg PO q8h').slots.length, 3);
assert.equal(parseLine('Ibuprofen 400 mg PO q6h PRN pain').prn, true);
assert.deepEqual(parseLine('Ibuprofen 400 mg PO q6h PRN pain').slots, []);
assert.deepEqual(parseLine('Atorvastatin 40 mg PO QHS').slots, ['bedtime']);
assert.deepEqual(parseLine('Warfarin 5 mg PO daily in the evening').slots, ['evening']);
assert.deepEqual(parseLine('Metformin 500 mg PO twice daily with meals').slots, ['morning', 'evening']);
assert.equal(parseLine('Metformin 500 mg PO BID with meals').withFood, 'with');
assert.equal(parseLine('Omeprazole 20 mg PO QD AC breakfast (30 min before)').withFood, 'before');
assert.equal(parseLine('Amoxicillin 250 mg/5 mL susp: 250 mg (5 mL) PO TID x10d').days, 10);
assert.equal(parseLine('Lisinopril 10 mg PO QD. Hold if SBP < 100').name, 'Lisinopril');
assert.equal(parseLine('Hold if SBP < 100'), null);
assert.equal(parseLine('Allergies: NKDA'), null);
for (const s of SCENARIOS) assert.ok(parseText(s.raw).length >= s.meds.length, `parse ${s.id}`);

// highlight: longest match wins, text round-trips
const segs = highlightTerms('Take twice daily PO with food');
assert.equal(segs.map((x) => x.text).join(''), 'Take twice daily PO with food');
assert.deepEqual(segs.filter((x) => x.term).map((x) => x.term.term), ['BID', 'PO', 'with food']);

// data completeness: every translatable field has all 4 languages
for (const g of GLOSSARY) for (const l of LANGS) assert.ok(g.plain[l], `glossary ${g.term} ${l}`);
for (const s of SCENARIOS) {
  for (const l of LANGS) assert.ok(s.title[l] && s.patient[l], `scenario ${s.id} ${l}`);
  for (const med of s.meds) {
    for (const l of LANGS) assert.ok(med.plain[l] && med.purpose[l] && REDFLAGS[med.generic]?.[l], `${med.id} ${l}`);
  }
  for (const term of ['PO', 'QD', 'BID', 'QHS', 'SBP', 'orthostatic hypotension', 'edema', 'dyspnea', 'PRN'])
    assert.ok(highlightTerms(s.id === 'cardiac' ? s.raw : 'PO QD BID QHS SBP orthostatic hypotension edema dyspnea PRN').some((x) => x.term?.term === term), `highlight ${term}`);
}
assert.equal(t('en', 'crossChecked', { n: 4 }), '4 medications cross-checked');
for (const l of LANGS) assert.deepEqual(Object.keys(STRINGS[l]).sort(), Object.keys(STRINGS.en).sort(), `i18n ${l}`);

// ics
const ics = buildIcs(SCENARIOS[0].meds.concat(SCENARIOS[1].meds), { lang: 'zh' });
assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n'));
assert.ok(ics.includes('RRULE:FREQ=DAILY\r\n'));
assert.ok(ics.includes('RRULE:FREQ=DAILY;COUNT=10'));
assert.ok(ics.includes('BEGIN:VALARM'));
assert.ok(!/[^\r]\n/.test(ics), 'all line endings CRLF');
for (const line of ics.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75, 'folded: ' + line);
assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 5 + 4); // cardiac 5 slots + amoxicillin 3 + cetirizine 1 (ibuprofen PRN skipped)

// google calendar link
const g = new URL(googleCalendarUrl(SCENARIOS[1].meds[0], 'noon', new Date(2026, 10, 22)));
assert.equal(g.searchParams.get('action'), 'TEMPLATE');
assert.equal(g.searchParams.get('recur'), 'RRULE:FREQ=DAILY;COUNT=10');
assert.equal(g.searchParams.get('dates'), '20261122T120000/20261122T121500');

// cabinet: same generic + strength merges
cabinet.clear();
let ticks = 0;
const unsub = cabinet.subscribe(() => ticks++);
const snap0 = cabinet.getSnapshot();
assert.equal(cabinet.getSnapshot(), snap0, 'stable snapshot');
const c1 = cabinet.upsert({ name: 'Metformin', generic: 'metformin', strength: '500 mg', slots: ['morning', 'evening'], pillsLeft: 60 });
cabinet.upsert({ name: 'Metformin HCl', generic: 'Metformin', strength: '500mg', pillsLeft: 30 });
cabinet.upsert({ name: 'Metformin', generic: 'metformin', strength: '1000 mg', pillsLeft: 30 });
assert.equal(cabinet.list().length, 2, 'merged duplicate');
assert.equal(cabinet.list()[0].pillsLeft, 90);
assert.ok(cabinet.list()[0].refillDate);
cabinet.markTaken(c1.id, '2026-11-22', 'morning');
cabinet.markTaken(c1.id, '2026-11-22', 'morning'); // idempotent
assert.deepEqual(cabinet.takenOn('2026-11-22').map(({ id, slot }) => ({ id, slot })), [{ id: c1.id, slot: 'morning' }]);
assert.ok(cabinet.takenOn('2026-11-22')[0].at);
assert.equal(cabinet.list()[0].pillsLeft, 89);
assert.notEqual(cabinet.getSnapshot(), snap0);
assert.equal(ticks, 4);
cabinet.remove(c1.id);
assert.equal(cabinet.list().length, 1);
unsub();

// readability: plain output reads easier than the clinical note
for (const sc of SCENARIOS) {
  const note = fkGrade(sc.raw), plain = fkGrade(sc.meds.map((m) => m.plain.en).join(' '));
  console.log(`grade ${sc.id}: note ${note} -> plain ${plain}`);
  assert.ok(note > plain, `readability ${sc.id}`);
}

// share round-trip (UTF-8)
const plan = { scenario: 'cardiac', lang: 'zh', meds: SCENARIOS[0].meds.slice(0, 1) };
const code = encodePlan(plan);
assert.match(code, /^[A-Za-z0-9_-]+$/);
assert.deepEqual(decodePlan('#plan=' + code), plan);
assert.equal(decodePlan('#plan=%%%garbage'), null);

// interactions (offline snapshot)
const names = (r) => r.interactions.map((x) => `${x.a} + ${x.b} [${x.severity}, ${x.source}]`);
const diab = await checkInteractions(SCENARIOS[2].meds, { offline: true });
const wa = diab.interactions.find((x) => /warfarin/i.test(x.a + x.b) && /aspirin/i.test(x.a + x.b));
assert.ok(wa && wa.severity === 'High' && wa.excerpt && wa.source === 'rule+fda' && wa.labelSource === 'snapshot', 'warfarin+aspirin High');
assert.equal(diab.checkedCount, 4);
assert.equal(diab.interactions[0].severity, 'High');
const wi = await checkInteractions([{ name: 'Warfarin', generic: 'warfarin' }, { name: 'Ibuprofen', generic: 'ibuprofen' }], { offline: true });
assert.ok(wi.interactions[0]?.severity === 'High' && wi.interactions[0].excerpt, 'warfarin+ibuprofen High');
const card = await checkInteractions(SCENARIOS[0].meds, { offline: true });
const ped = await checkInteractions(SCENARIOS[1].meds, { offline: true });
for (const [k, r] of Object.entries({ cardiac: card, pediatric: ped, diabetes: diab })) console.log(k, r.checkedCount, 'checked:', names(r));
console.log('warfarin+aspirin excerpt:', wa.excerpt);

if (process.argv.includes('--live')) {
  const live = await getLabel('warfarin');
  console.log('LIVE warfarin:', live.source, live.brand, '| interactions chars:', live.full.interactions.length);
  const lw = await checkInteractions([{ name: 'Warfarin', generic: 'warfarin' }, { name: 'Aspirin', generic: 'aspirin' }]);
  console.log('LIVE warfarin+aspirin:', names(lw), lw.interactions[0]?.labelSource);
  console.log('  ', live.interactionsText.slice(0, 160));
}
console.log('selfcheck OK');
