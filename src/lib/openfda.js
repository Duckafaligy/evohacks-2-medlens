import SNAPSHOT from '../data/labels-snapshot.json' with { type: 'json' };
import { keywordsFor, INTERACTION_RULES } from '../data/fallback.js';

const API = 'https://api.fda.gov/drug/label.json';
const cache = new Map(); // generic -> Promise<label>

const first = (v) => (Array.isArray(v) ? v.join(' ') : v || '');
const squash = (s) => (s || '').replace(/\s+/g, ' ').trim();

// Short readable excerpt: drop the leading section heading ("5 WARNINGS AND PRECAUTIONS"),
// "( 5.1 )" cross-refs, then cut at a sentence end before `max` chars.
export function excerpt(text, max = 280) {
  let s = squash(text)
    .replace(/\(\s*[\d.,\s]+\)/g, '')
    .replace(/^(?:\d+(?:\.\d+)?\s+)?(?:[A-Z][A-Z&/,-]+\s+)+/, '')
    .replace(/^(?:Warnings|Drug Interactions|Adverse Reactions)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '));
  return end > max * 0.4 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, '') + '…';
}

// Sentence around a keyword hit.
function sentenceAround(text, idx, max = 260) {
  const s = squash(text);
  let start = Math.max(s.lastIndexOf('. ', idx) + 2, idx - max / 2, 0);
  if (start > 0 && s[start - 2] !== '.') start = s.indexOf(' ', start) + 1; // don't cut mid-word
  let end = s.indexOf('. ', idx);
  end = end === -1 ? s.length : end + 1;
  end = Math.min(end, start + max);
  return (start > 0 ? '…' : '') + s.slice(start, end).trim() + (end < s.length && s[end - 1] !== '.' ? '…' : '');
}

const dropLead = (s) => s.replace(/^(?:Active ingredients?(?:\s*\([^)]*\))?|Purposes?|Directions|Uses)\s*:?\s*/i, '');

function shape(raw, source) {
  return {
    source, // 'openfda' | 'snapshot' | 'none'
    brand: raw.brand || '',
    boxedWarning: raw.boxedWarning ? excerpt(raw.boxedWarning, 300) : '',
    warnings: excerpt(raw.warnings, 300),
    sideEffects: excerpt(raw.sideEffects || raw.otcStopUse, 300),
    interactionsText: excerpt(raw.interactions, 300),
    // full text, used for matching in checkInteractions
    full: { interactions: squash(raw.interactions), warnings: squash(raw.warnings) },
    // extra fields for getRecap (snapshot has none of these; recap falls back)
    activeIngredients: dropLead(squash(raw.activeIngredients)).slice(0, 300), // no excerpt(): it would strip "WARFARIN SODIUM" as a heading
    purpose: dropLead(excerpt(raw.purpose, 300)),
    howToTake: dropLead(excerpt(raw.howToTake, 300)),
  };
}

function fromSnapshot(generic) {
  const raw = SNAPSHOT[generic];
  return raw ? shape(raw, 'snapshot') : shape({}, 'none');
}

async function fetchLabel(field, generic, timeout) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeout);
  try {
    // limit=5 so we can skip combination products (e.g. "lisinopril and hydrochlorothiazide").
    const url = `${API}?search=${field}:${encodeURIComponent(`"${generic}"`)}&limit=5`;
    const res = await fetch(url, { signal: ctl.signal });
    if (!res.ok) return null;
    const { results = [] } = await res.json();
    const single = results.find((r) => !/\band\b|\//i.test(first(r.openfda?.generic_name))) || results[0];
    if (!single) return null;
    return {
      brand: first(single.openfda?.brand_name?.[0]),
      activeIngredients: first(single.active_ingredient || single.spl_product_data_elements || single.openfda?.substance_name),
      purpose: first(single.purpose || single.indications_and_usage),
      howToTake: first(single.dosage_and_administration || single.directions),
      boxedWarning: first(single.boxed_warning),
      warnings: first(single.warnings_and_cautions || single.warnings || single.precautions),
      sideEffects: first(single.adverse_reactions),
      // OTC labels have no drug_interactions section; their interaction advice is in ask_doctor_or_pharmacist.
      interactions: first(single.drug_interactions || single.ask_doctor_or_pharmacist),
      otcStopUse: first(single.stop_use),
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * getLabel('warfarin') -> { source, brand, boxedWarning, warnings, sideEffects, interactionsText, full }
 * Tries OpenFDA (generic name, then brand name), falls back to the bundled snapshot.
 */
export function getLabel(generic, { offline = false, timeout = 4000 } = {}) {
  const key = (generic || '').toLowerCase().trim();
  if (offline) return Promise.resolve(fromSnapshot(key));
  if (!cache.has(key)) {
    const p = (async () => {
      try {
        const raw = (await fetchLabel('openfda.generic_name', key, timeout))
          || (await fetchLabel('openfda.brand_name', key, timeout));
        if (raw && (raw.warnings || raw.interactions)) return shape(raw, 'openfda');
      } catch { /* network/timeout -> snapshot */ }
      return fromSnapshot(key);
    })();
    cache.set(key, p);
  }
  return cache.get(key);
}

/**
 * getRecap('warfarin', {offline}) -> { activeIngredients, purpose, howToTake, warnings, sideEffects, source }
 * Each field ~300 chars. Snapshot fallback lacks purpose/howToTake (returned as '').
 */
export async function getRecap(generic, opts = {}) {
  const l = await getLabel(generic, opts);
  const name = (generic || '').trim();
  return {
    activeIngredients: l.activeIngredients || (name ? name[0].toUpperCase() + name.slice(1) : ''),
    purpose: l.purpose,
    howToTake: l.howToTake,
    warnings: l.boxedWarning || l.warnings,
    sideEffects: l.sideEffects,
    source: l.source,
  };
}

function findHit(label, otherGeneric) {
  for (const part of ['interactions', 'warnings']) {
    const text = label.full[part];
    const lower = text.toLowerCase();
    for (const kw of keywordsFor(otherGeneric)) {
      const idx = lower.indexOf(kw);
      if (idx !== -1) return { excerpt: sentenceAround(text, idx), keyword: kw };
    }
  }
  return null;
}

/**
 * checkInteractions([{name, generic}, ...], {offline}) ->
 *   { interactions: [{ a, b, severity: 'High'|'Moderate'|'Low', plain: {en,es,fr,zh}|null, excerpt,
 *                      source: 'rule+fda'|'fda'|'rule', labelSource: 'openfda'|'snapshot'|null }],
 *     checkedCount, pairCount }
 * Severity comes from the curated rules table; a label-text-only match is 'Low' (monitor).
 * Label search: each drug's interactions section, then warnings, for the other drug's name/class words.
 */
export async function checkInteractions(meds, opts = {}) {
  const list = meds.filter((m) => m.generic);
  const labels = await Promise.all(list.map((m) => getLabel(m.generic, opts)));
  const interactions = [];
  let pairCount = 0;
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const [A, B] = [list[i], list[j]];
      if (A.generic.toLowerCase() === B.generic.toLowerCase()) continue;
      pairCount++;
      const hitA = findHit(labels[i], B.generic);
      const hitB = hitA ? null : findHit(labels[j], A.generic);
      const hit = hitA || hitB;
      const rule = INTERACTION_RULES[[A.generic, B.generic].map((g) => g.toLowerCase()).sort().join('+')];
      if (!hit && !rule) continue;
      interactions.push({
        a: A.name || A.generic,
        b: B.name || B.generic,
        severity: rule?.severity || 'Low',
        plain: rule?.plain || null,
        excerpt: hit?.excerpt || '',
        source: rule ? (hit ? 'rule+fda' : 'rule') : 'fda',
        labelSource: hit ? (hitA ? labels[i] : labels[j]).source : null,
        labelOf: hit ? (hitA ? A.generic : B.generic) : null,
      });
    }
  }
  const rank = { High: 0, Moderate: 1, Low: 2 };
  interactions.sort((x, y) => rank[x.severity] - rank[y.severity]);
  return { interactions, checkedCount: list.length, pairCount };
}
