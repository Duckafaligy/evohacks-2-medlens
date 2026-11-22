// Fetch real OpenFDA label excerpts for every demo drug -> offline snapshot.
// Usage: node tools/snapshot-labels.mjs src/data/labels-snapshot.json
const drugs = ['metoprolol','lisinopril','atorvastatin','furosemide','aspirin','amoxicillin','azithromycin','acetaminophen','ibuprofen','metformin','warfarin','cephalexin','cetirizine','omeprazole'];
const cut = (a, n) => (a?.[0] || '').replace(/\s+/g, ' ').trim().slice(0, n);
const single = (L) => (L.openfda?.generic_name || []).every(g => !/ AND |,/i.test(g));
const out = {};
for (const d of drugs) {
  let L;
  for (const f of ['openfda.generic_name', 'openfda.substance_name']) {
    const r = await fetch(`https://api.fda.gov/drug/label.json?search=${f}:%22${d}%22&limit=20`).then(x => x.json());
    L = r.results?.find(single) || r.results?.[0];
    if (L) break;
  }
  if (!L) { console.log('MISS', d); continue; }
  out[d] = {
    brand: L.openfda?.brand_name?.[0] || null,
    genericName: L.openfda?.generic_name?.[0] || d,
    activeIngredients: cut(L.active_ingredient, 300) || (L.openfda?.substance_name || []).join(', '),
    purpose: cut(L.purpose || L.indications_and_usage, 600),
    howToTake: cut(L.dosage_and_administration || L.directions, 600),
    boxedWarning: cut(L.boxed_warning, 600),
    warnings: cut(L.warnings_and_cautions || L.warnings, 1200),
    sideEffects: cut(L.adverse_reactions, 900),
    interactions: cut(L.drug_interactions || L.ask_doctor_or_pharmacist || L.ask_doctor, 8000),
    otcStopUse: cut(L.stop_use, 500),
    setId: L.set_id, effectiveTime: L.effective_time,
  };
  console.log('ok', d, '->', out[d].genericName);
}
out._meta = { source: 'api.fda.gov/drug/label.json', fetched: new Date().toISOString() };
(await import('node:fs')).writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
