import { chromium } from 'playwright';
const html = `<html><body style="margin:0;background:#fff;font-family:Arial,Helvetica,sans-serif;color:#111">
<div style="width:1100px;padding:56px 64px">
<div style="font-size:30px;font-weight:700">Discharge Summary &mdash; SAMPLE (not a real patient)</div>
<div style="font-size:22px;margin-top:8px">Patient: J. Doe &nbsp;&nbsp; Age: 78 &nbsp;&nbsp; Dx: CHF exacerbation, hypertension, T2DM</div>
<hr style="border:0;border-top:3px solid #111;margin:24px 0">
<div style="font-size:26px;font-weight:700;margin-bottom:12px">Discharge Medications</div>
<div style="font-size:26px;line-height:1.7">
1. Furosemide 40 mg PO QD<br>
2. Lisinopril 10 mg PO QD. Hold if SBP &lt; 100<br>
3. Metformin 500 mg PO BID with meals<br>
4. Atorvastatin 20 mg PO QHS<br>
</div>
<div style="font-size:26px;font-weight:700;margin:28px 0 12px">Instructions</div>
<div style="font-size:24px;line-height:1.6">
Weigh daily. Report weight gain &gt; 2 lb in 1 day or increased edema.<br>
Return to ED for dyspnea, chest pain, or syncope.<br>
Rise slowly; risk of orthostatic hypotension.<br>
Acetaminophen 500 mg PO q6h PRN pain. Avoid NSAIDs.
</div></div></body></html>`;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1100, height: 640 } });
await p.setContent(html); await p.screenshot({ path: process.argv[2], fullPage: true }); await b.close();
