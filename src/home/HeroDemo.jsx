// Hero product window (Paper 73G-0): ONE stable Translate screen. The only motion is a cursor gliding
// between the three callout spots; each callout pill fades in when the cursor arrives. rAF clock → t;
// pauses on hover, off-screen, hidden tab and via the chrome button. Reduced motion: all callouts shown.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { SCENARIOS } from '../data/scenarios.js';
import { fkGrade } from '../lib/readability.js';

const CARDIAC = SCENARIOS[0];
const G0 = Math.round(fkGrade(CARDIAC.raw));
const G1 = Math.max(1, Math.round(fkGrade(CARDIAC.meds.map((m) => m.plain.en).join(' '))));
const U = 'text-primary underline decoration-1';

const LOOP = 9.9;
const clamp = (x) => Math.min(1, Math.max(0, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = (p) => 1 - (1 - p) ** 3; // ≈ cubic-bezier(0.2,0,0,1)
const inOut = (p) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);
const fade = (t, a, d = 0.2) => ease(seg(t, a, a + d));
// [label, colour, pill in, pill out]; the cursor glides 900ms to the next spot after each pill leaves.
const CALLOUTS = [
  ['Tapping a medical word', '#1849A9', 0.1, 2.6],
  ['Reading level drops', '#A14A06', 3.7, 5.9],
  ['Checking the FDA label', '#12704F', 7.0, 8.9],
];
const GLIDES = [[2.7, 3.6, 0, 1], [6.0, 6.9, 1, 2], [9.0, 9.9, 2, 0]]; // [start, end, from, to]
const ARROW = 'M4 2l16 9-7 2-3 7z';

const reducedMQ = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

export default function HeroDemo() {
  const [reduced] = useState(reducedMQ);
  const [t, setT] = useState(reduced ? 1 : 0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [tabHidden, setTabHidden] = useState(false);
  const [pts, setPts] = useState(null); // cursor box top-left for each callout, window coordinates
  const tRef = useRef(t);
  const winRef = useRef(null);
  const bidRef = useRef(null);
  const chipRef = useRef(null);
  const stripRef = useRef(null);

  const seek = useCallback((v) => { tRef.current = ((v % LOOP) + LOOP) % LOOP; setT(tRef.current); }, []);
  const running = !reduced && !paused && !hover && onScreen && !tabHidden;

  useEffect(() => {
    if (!running) return undefined;
    let raf; let last = performance.now();
    const tick = (now) => {
      tRef.current = (tRef.current + Math.min(0.1, (now - last) / 1000)) % LOOP;
      last = now; setT(tRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  useEffect(() => {
    const el = winRef.current;
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting)) : null;
    io?.observe(el);
    const vis = () => setTabHidden(document.hidden);
    document.addEventListener('visibilitychange', vis);
    window.__medlensDemoSeek = (v) => { setPaused(true); seek(v); };
    return () => { io?.disconnect(); document.removeEventListener('visibilitychange', vis); delete window.__medlensDemoSeek; };
  }, [seek]);

  // Callout spots, offsets taken from Paper 73G-0 at 1120px; measured on resize / font load only.
  useLayoutEffect(() => {
    const measure = () => {
      const r = winRef.current?.getBoundingClientRect();
      const rect = (ref) => { const b = ref.current?.getBoundingClientRect(); return b && b.width ? { l: b.left - r.left, t: b.top - r.top, r: b.right - r.left, b: b.bottom - r.top, w: b.width, h: b.height } : null; };
      const bid = rect(bidRef); const chip = rect(chipRef); const strip = rect(stripRef);
      if (!r || !bid || !chip || !strip) return;
      setPts([
        [bid.l + bid.w / 2 + 6, bid.t + bid.h / 2 - 14],
        [Math.max(8, chip.l - 36), chip.t + 20],
        [strip.l + Math.min(279, Math.max(8, strip.w - 230)), strip.t - 30],
      ]);
    };
    measure();
    document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(measure); ro.observe(winRef.current);
    return () => ro.disconnect();
  }, []);

  // Cursor: resting spot + glide (transform only)
  let cur = [0, 0]; let col = CALLOUTS[0][1];
  if (pts) {
    const g = GLIDES.find(([s0, e]) => t >= s0 && t < e);
    if (g) {
      const p = inOut(seg(t, g[0], g[1]));
      cur = [pts[g[2]][0] + (pts[g[3]][0] - pts[g[2]][0]) * p, pts[g[2]][1] + (pts[g[3]][1] - pts[g[2]][1]) * p];
      col = CALLOUTS[g[3]][1];
    } else {
      const at = t < 2.7 ? 0 : t < 6 ? 1 : t < 9 ? 2 : 0;
      cur = pts[at]; col = CALLOUTS[at][1];
    }
  }

  return (
    <div className="mx-auto max-w-[1120px]">
      <div ref={winRef} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        className="relative overflow-hidden rounded-[14px] border border-line bg-surface text-left shadow-[0_24px_60px_#1849A91F]">
        <div className="flex h-[38px] shrink-0 items-center gap-[7px] border-b border-[#EDF0F4] px-4">
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <span key={c} className="size-2.5 shrink-0 rounded-full" style={{ background: c, boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,.18)' }} aria-hidden="true" />)}
          <span className="flex flex-1 justify-center pr-[37px]" aria-hidden="true">
            <span className="rounded-[6px] bg-canvas px-3 py-[3px] text-[12px] leading-4 text-ink-2">medlens.app/translate</span>
          </span>
          {!reduced && (
            <button type="button" onClick={() => setPaused((p) => !p)} aria-pressed={paused} aria-label={paused ? 'Play demo' : 'Pause demo'}
              className="absolute right-3 top-[7px] grid size-6 place-items-center rounded-[6px] text-ink-2 transition-colors duration-[160ms] hover:bg-canvas hover:text-ink">
              <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                {paused ? <path d="M7 4l13 8-13 8z" /> : <><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></>}
              </svg>
            </button>
          )}
        </div>

        <div className="flex md:h-[440px]" aria-hidden="true">
          <div className="hidden w-[190px] shrink-0 flex-col gap-1 border-r border-[#EDF0F4] px-2.5 py-4 md:flex">
            <div className="flex items-center gap-[7px] px-1.5 pb-3">
              <span className="grid size-[22px] shrink-0 place-items-center rounded-[6px] bg-primary">
                <svg width="13" height="13" viewBox="0 0 44 44"><circle cx="19" cy="19" r="13" fill="none" stroke="#FFFFFF" strokeWidth="5" /><path d="M28.5 28.5L38 38" fill="none" stroke="#FFFFFF" strokeWidth="5.5" strokeLinecap="round" /></svg>
              </span>
              <span className="text-[14px] font-semibold leading-[18px] text-black">MedLens</span>
            </div>
            {[['Today'], ['Translate', null, true], ['Safety', 1], ['My medicines', CARDIAC.meds.length], ['Calendar']].map(([l, n, on]) => (
              <span key={l} className={`flex h-8 shrink-0 items-center justify-between rounded-[6px] px-2 text-[13px] leading-4 ${on ? 'bg-primary-soft font-semibold text-primary' : 'text-[#2A3547]'}`}>
                {l}
                {l === 'Safety' && <span className="rounded-[5px] bg-danger px-1.5 text-[11px] font-semibold leading-[14px] text-white">{n}</span>}
                {l === 'My medicines' && <span className="text-[12px] leading-4 text-ink-2">{n}</span>}
              </span>
            ))}
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex min-h-[46px] shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#EDF0F4] px-5 py-2">
              <p className="text-[13px] leading-4 text-ink-2">Translate / <span className="font-semibold text-ink">Harold’s discharge note</span></p>
              <span ref={chipRef} className="rounded-[6px] bg-[#F1F9F4] px-2.5 py-[3px] text-[12px] font-semibold leading-4 text-black">
                <span className="text-danger">Grade {G0}</span> → <span className="text-safe">Grade {G1}</span>
              </span>
            </div>
            <div className="flex flex-1 flex-col md:flex-row">
              <div className="flex flex-1 basis-0 flex-col gap-2.5 border-b border-[#EDF0F4] p-5 md:border-b-0 md:border-r">
                <p className="text-[12px] leading-4 text-ink-2">What the doctor wrote</p>
                <p className="whitespace-pre-wrap font-mono text-[13px] leading-7 text-black md:text-[14px]">
                  Furosemide 40 mg <span className={U}>PO</span> <span className={U}>QD</span>{'\n'}
                  Lisinopril 10 mg <span className={U}>PO</span> <span className={U}>QD</span>{'\n'}
                  Metformin 500 mg <span className={U}>PO</span> <span ref={bidRef} className={`${U} font-semibold`}>BID</span> c meals{'\n'}
                  Atorvastatin 20 mg <span className={U}>PO</span> <span className={U}>QHS</span>{'\n'}
                  <span className="text-ink-2">Hold lisinopril if </span><span className={U}>SBP</span><span className="text-ink-2"> &lt; 100</span>{'\n'}
                  <span className="text-ink-2">Daily wt. F/u cardiology 1 wk.</span>
                </p>
              </div>
              <div className="flex flex-[1.1] basis-0 flex-col gap-2.5 p-5">
                <p className="text-[12px] leading-4 text-ink-2">In plain words</p>
                <div className="flex flex-col gap-[3px] rounded-[10px] border border-[#C9D8F5] bg-primary-soft px-3.5 py-3">
                  <span className="font-mono text-[12px] leading-4 text-primary">BID</span>
                  <span className="text-[17px] font-semibold leading-[22px] text-black">Twice a day</span>
                  <span className="text-[12px] leading-4 text-[#2A3547]">On your list: Metformin 500 mg</span>
                </div>
                <div className="flex flex-col gap-[7px] text-[13px] leading-4 text-black">
                  <p><span className="font-semibold">Furosemide</span> · 1 pill each morning</p>
                  <p><span className="font-semibold">Lisinopril</span> · 1 pill each morning</p>
                  <p><span className="font-semibold">Metformin</span> · with breakfast and dinner</p>
                  <p><span className="font-semibold">Atorvastatin</span> · at bedtime</p>
                  <p className="pt-1.5 text-ink-2">Skip lisinopril if your top blood pressure number is under 100.</p>
                </div>
              </div>
            </div>
            <div ref={stripRef} className="flex min-h-12 shrink-0 flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-[#EDF0F4] bg-caution-soft px-5 py-2">
              <svg width="16" height="16" viewBox="0 0 24 24" className="shrink-0">
                <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" fill="none" stroke="#A14A06" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 9v4M12 17h.01" fill="none" stroke="#A14A06" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[13px] font-semibold leading-4 text-black">Furosemide + Lisinopril</span>
              <span className="rounded-[5px] bg-caution px-[7px] py-px text-[11px] font-semibold leading-[14px] text-white">Moderate</span>
              <span className="text-[12px] leading-4 text-[#6E3203]">May cause dizziness</span>
            </div>
          </div>
        </div>

        {/* Callout pills (each at its spot) + one travelling cursor */}
        {pts && CALLOUTS.map(([label, c, a, b], i) => {
          const o = reduced ? 1 : fade(t, a) * (1 - fade(t, b));
          return (
            <span key={label} className="pointer-events-none absolute left-0 top-0 flex items-start gap-1" aria-hidden="true"
              style={{ transform: `translate(${pts[i][0]}px, ${pts[i][1]}px)` }}>
              {reduced && <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0"><path d={ARROW} fill={c} stroke="#FFFFFF" strokeWidth="1.5" /></svg>}
              <span className="mt-3 whitespace-nowrap rounded-[7px] px-2.5 py-[5px] text-[13px] font-semibold leading-4 text-white"
                style={{ background: c, opacity: o, transform: `translateY(${(1 - o) * 4}px)`, marginLeft: reduced ? 0 : 22 }}>{label}</span>
            </span>
          );
        })}
        {pts && !reduced && (
          <svg width="18" height="18" viewBox="0 0 24 24" className="pointer-events-none absolute left-0 top-0" aria-hidden="true"
            style={{ transform: `translate(${cur[0]}px, ${cur[1]}px)` }}>
            <path d={ARROW} fill={col} stroke="#FFFFFF" strokeWidth="1.5" style={{ transition: 'fill 200ms' }} />
          </svg>
        )}
      </div>

      <p className="flex items-center justify-center gap-2 pb-9 pt-5 text-center text-[14px] leading-[18px] text-[#2A3547]">
        <svg width="16" height="16" viewBox="0 0 24 24" className="shrink-0" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="none" stroke="#12704F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 12l2 2 4-4" fill="none" stroke="#12704F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Interaction data from the U.S. FDA drug label · Checked {today}
      </p>
    </div>
  );
}
