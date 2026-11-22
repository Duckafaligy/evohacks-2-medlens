import { GLOSSARY } from '../data/glossary.js';

const SLOT_WORDS = { morning: 'morning', noon: 'noon', evening: 'evening', bedtime: 'bedtime' };
const ROUTES = GLOSSARY.filter((g) => g.category === 'route');
const FREQS = GLOSSARY.filter((g) => g.category === 'frequency' && g.slots);
const byTerm = Object.fromEntries(GLOSSARY.map((g) => [g.term, g]));

const DOSE = /(\d+(?:\.\d+)?)\s*(mg\/kg|mg|mcg|µg|g|ml|units?|tabs?|tablets?|caps?|capsules?|puffs?|drops?)(?![\w])/i;

const listWords = (slots) =>
  slots.length < 2 ? slots.join('') : `${slots.slice(0, -1).join(', ')} and ${slots.at(-1)}`;

/**
 * parseLine('Metoprolol tartrate 25 mg PO BID with food') ->
 * { raw, name, generic, dose, route, frequency, slots, prn, withFood, water, days, plain }
 * Returns null for lines with no dose.
 */
export function parseLine(line) {
  const raw = line.trim();
  if (!raw) return null;
  const doseM = raw.match(DOSE);
  const freq = FREQS.find((g) => g.match.test(raw)) || null;
  const prn = byTerm.PRN.match.test(raw);
  const stat = byTerm.STAT.match.test(raw);
  if (!doseM) return null; // headers, allergy lines, "Hold if SBP < 100", "Daily weights"...

  const route = ROUTES.find((g) => g.match.test(raw)) || null;
  const name = (doseM ? raw.slice(0, doseM.index) : raw.split(/\s+/).slice(0, 2).join(' '))
    .replace(/^(?:OTC|Rx)\s*:\s*/i, '')
    .replace(/[\s,:(-]+$/, '')
    .trim();
  const generic = (name.split(/\s+/)[0] || '').toLowerCase();

  let withFood = 'any';
  if (byTerm.AC.match.test(raw) || /before (?:breakfast|meals?|eating)/i.test(raw)) withFood = 'before';
  else if (byTerm['with food'].match.test(raw) || byTerm.PC.match.test(raw)) withFood = 'with';
  else if (byTerm['empty stomach'].match.test(raw)) withFood = 'without';
  const daysM = raw.match(/(?<![\w])(?:x\s?(\d+)\s?d(?:ays?)?|for (\d+) days)(?![\w])/i);
  const days = daysM ? Number(daysM[1] || daysM[2]) : undefined;
  const water = /full glass of water|8\s?oz/i.test(raw);

  // As-needed meds have no fixed times; they show in an "as needed" list, not the timeline.
  const slots = prn || stat ? [] : freq ? [...freq.slots] : ['morning'];
  const dose = doseM ? `${doseM[1]} ${doseM[2]}` : '';

  const parts = [`Take ${dose || 'your dose'}`];
  if (route) parts.push(route.plain.en);
  let sentence = parts.join(' ');
  if (stat) sentence += ', right away';
  if (freq) sentence += `, ${freq.plain.en}`;
  if (slots.length) sentence += ` (${listWords(slots.map((s) => SLOT_WORDS[s]))})`;
  if (prn) sentence += `, ${byTerm.PRN.plain.en}`;
  if (withFood === 'with') sentence += '. Take it with food';
  if (withFood === 'before') sentence += '. Take it before you eat';
  if (withFood === 'without') sentence += '. Take it on an empty stomach';
  if (water) sentence += withFood === 'any' ? '. Take it with a full glass of water' : ' and a full glass of water';
  if (days) sentence += `. Keep taking it for ${days} days`;
  sentence += '.';

  return {
    raw, name, generic, dose,
    route: route?.term || null,
    frequency: freq?.term || (prn ? 'PRN' : null),
    slots, prn, withFood, water, days,
    plain: sentence,
  };
}

/** parseText(multiline) -> parsed meds (non-med lines skipped). */
export function parseText(text) {
  return (text || '').split(/\r?\n/).map(parseLine).filter(Boolean);
}

/**
 * highlightTerms('Metoprolol 25 mg PO BID') ->
 * [{text:'Metoprolol 25 '}, {text:'mg', term:<glossary entry>}, {text:' '}, {text:'PO', term}, ...]
 * Overlaps resolve to the longest match ("twice daily" beats "daily").
 */
export function highlightTerms(text) {
  const hits = [];
  for (const g of GLOSSARY) {
    const re = new RegExp(g.match.source, g.match.flags.replace('g', '') + 'g');
    for (const m of text.matchAll(re)) hits.push({ start: m.index, end: m.index + m[0].length, term: g });
  }
  hits.sort((a, b) => a.start - b.start || b.end - a.end);
  const segs = [];
  let pos = 0;
  for (const h of hits) {
    if (h.start < pos) continue; // overlapped by an earlier/longer hit
    if (h.start > pos) segs.push({ text: text.slice(pos, h.start) });
    segs.push({ text: text.slice(h.start, h.end), term: h.term });
    pos = h.end;
  }
  if (pos < text.length) segs.push({ text: text.slice(pos) });
  return segs;
}
