// Hero product window: ONE stable Translate screen. The only motion is a cursor gliding between
// three points with small callout pills (LaunchVault-style). rAF clock → t; pauses on hover,
// off-screen and hidden tab; reduced motion shows the screen at rest with all three pills.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { SCENARIOS } from '../data/scenarios.js';
import { fkGrade } from '../lib/readability.js';

const CARDIAC = SCENARIOS[0];
const G0 = Math.round(fkGrade(CARDIAC.raw));
const G1 = Math.max(1, Math.round(fkGrade(CARDIAC.meds.map((m) => m.plain.en).join(' '))));
const LINES = CARDIAC.raw.split('\n').filter((l) => /\bmg\b/.test(l))
  .map((l) => (l.match(/^.*?\b(QD|BID|TID|QID|QHS|q\d+h)\b/) || [l])[0]);
const SLOT = { morning: 'morning', noon: 'noon', evening: 'evening', bedtime: 'bedtime' };

const LOOP = 10.5;
const clamp = (x) => Math.min(1, Math.max(0, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = (p) => 1 - (1 - p) ** 3; // ≈ cubic-bezier(0.2,0,0,1)
const inOut = (p) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);
const fade = (t, a, d = 0.2) => ease(seg(t, a, a + d));
const show = (t, a, b) => fade(t, a) * (1 - fade(t, b)); // in at a, out at b
// Cursor path: [arrive time, glide 900ms before it]
const STOPS = [0.9, 3.5, 6.1];
const PILLS = [ // [label, colour, in, out, offset x, offset y]
  ['Tapping a medical word', 'bg-primary', 1.0, 3.2, 20, -6],
  ['Reading level drops', 'bg-caution', 3.6, 5.8, 20, -6],
  ['Checking the FDA label', 'bg-safe', 6.2, 8.6, 18, 14],
];

const reducedMQ = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function HeroDemo() {
  const [reduced] = useState(reducedMQ);
  const [t, setT] = useState(reduced ? 8 : 0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [tabHidden, setTabHidden] = useState(false);
  const [pts, setPts] = useState(null); // [[x,y] start, bid, grade, strip]
  const tRef = useRef(t);
  const bodyRef = useRef(null);
  const bidRef = useRef(null);
  const gradeRef = useRef(null);
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
    const el = bodyRef.current;
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting)) : null;
    io?.observe(el);
    const vis = () => setTabHidden(document.hidden);
    document.addEventListener('visibilitychange', vis);
    window.__medlensDemoSeek = (v) => { setPaused(true); seek(v); };
    return () => { io?.disconnect(); document.removeEventListener('visibilitychange', vis); delete window.__medlensDemoSeek; };
  }, [seek]);

  // Cursor targets: measured on resize / font load only (never per frame).
  useLayoutEffect(() => {
    const measure = () => {
      const r = bodyRef.current?.getBoundingClientRect();
      const at = (ref, fx, fy) => { const b = ref.current?.getBoundingClientRect(); return b && b.width ? [b.left - r.left + b.width * fx, b.top - r.top + b.height * fy] : null; };
      const p = [at(bidRef, 0.55, 0.6), at(gradeRef, 0.8, 0.6), at(stripRef, 0.3, 0.55)];
      if (r && p.every(Boolean)) setPts([[r.width * 0.62, r.height * 0.9], ...p]);
    };
    measure();
    document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(measure); ro.observe(bodyRef.current);
    return () => ro.disconnect();
  }, []);

  // Cursor position from t (transform only)
  let cx = 0; let cy = 0;
  if (pts) {
    const legs = [[0, 1, STOPS[0]], [1, 2, STOPS[1]], [2, 3, STOPS[2]], [3, 0, LOOP]];
    [cx, cy] = pts[3];
    for (const [a, b, end] of legs) {
      const p = inOut(seg(t, end - 0.9, end));
      if (t <= end) { [cx, cy] = [pts[a][0] + (pts[b][0] - pts[a][0]) * p, pts[a][1] + (pts[b][1] - pts[a][1]) * p]; break; }
      [cx, cy] = pts[b];
    }
  }
  const ripple = STOPS.map((s) => seg(t, s, s + 0.45));
  const pulse = Math.sin(Math.PI * seg(t, 0.95, 1.45));
  const grade = reduced ? G1 : Math.round(G0 + (G1 - G0) * ease(seg(t, 3.6, 4.5)));
  const strip = reduced ? 1 : show(t, 6.15, 8.6);
  const cursorOn = !reduced && pts;

  return (
    <div className="mx-auto max-w-[1120px]">
      <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        className="relative overflow-hidden rounded-[14px] border border-line bg-surface text-left shadow-[0_12px_32px_#1849A914]">
        <div className="flex h-10 shrink-0 items-center gap-2 border-b border-[#EDF0F4] px-4" aria-hidden="true">
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <span key={c} className="size-2.5 shrink-0 rounded-full" style={{ background: c, boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,.18)' }} />)}
          <span className="flex flex-1 justify-center pr-[54px]">
            <span className="rounded-[6px] bg-canvas px-3 py-[3px] text-[13px] leading-4 text-ink-2">medlens.app/translate</span>
          </span>
        </div>

        <div ref={bodyRef} className="relative flex" aria-hidden="true">
          {/* Mini sidebar */}
          <nav className="hidden w-[184px] shrink-0 flex-col gap-1 border-r border-[#EDF0F4] p-3 md:flex">
            {[['Today'], ['Translate', null, true], ['Safety', 1], ['My medicines', CARDIAC.meds.length]].map(([l, n, on]) => (
              <span key={l} className={`flex items-center justify-between rounded-[8px] px-3 py-2 text-[14px] leading-[18px] ${on ? 'bg-primary-soft font-semibold text-primary' : 'text-ink-2'}`}>
                {l}
                {n != null && <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[12px] font-semibold leading-4 ${l === 'Safety' ? 'bg-danger text-white' : 'bg-canvas text-ink-2'}`}>{n}</span>}
              </span>
            ))}
          </nav>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-col md:flex-row">
              <div className="flex flex-1 flex-col gap-4 border-b border-[#EDF0F4] px-5 py-6 md:border-b-0 md:border-r md:px-7">
                <p className="text-[14px] leading-[18px] text-ink-2">What the label says</p>
                <div className="flex flex-col gap-2 font-mono text-[15px] leading-6 text-black md:text-[16px] md:leading-7">
                  {LINES.map((l) => (
                    <p key={l} className="whitespace-pre">{l.split(/(\b(?:PO|QD|BID|QHS)\b)/).filter(Boolean).map((p, k) => /^(PO|QD|BID|QHS)$/.test(p) ? (
                      <span key={k} ref={p === 'BID' ? bidRef : undefined}
                        className={`rounded-[5px] px-1 py-px font-semibold ${p === 'BID' ? 'bg-primary text-white' : 'bg-primary-soft text-primary'}`}>{p}</span>
                    ) : <span key={k}>{p}</span>)}</p>
                  ))}
                </div>
                <div ref={gradeRef} className="flex w-fit items-center gap-3 rounded-[10px] bg-[#F1F9F4] px-3.5 py-2.5">
                  <span className="text-[13px] leading-4 text-ink-2">Reading level</span>
                  <span className="text-[14px] leading-[18px] text-black"><span className="text-danger">Grade {G0}</span> → <span className="font-semibold tabular-nums text-safe">Grade {grade}</span></span>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-3.5 px-5 py-6 md:px-7">
                <p className="text-[14px] leading-[18px] text-ink-2">What it means</p>
                <div className="flex flex-col gap-1 rounded-[10px] bg-primary-soft p-4 shadow-[0_10px_24px_#1849A91F]"
                  style={{ transform: `scale(${1 + 0.02 * pulse})`, transformOrigin: 'left center' }}>
                  <span className="font-mono text-[13px] leading-4 text-primary">BID</span>
                  <span className="text-[20px] font-semibold leading-[26px] text-black">Twice a day</span>
                  <span className="text-[14px] leading-[18px] text-[#2A3547]">Morning and evening, with meals</span>
                </div>
                <ul className="flex flex-col gap-1.5 px-1">
                  {CARDIAC.meds.map((m) => (
                    <li key={m.id} className="text-[14px] leading-5 text-black"><span className="font-semibold">{m.name} {m.dose}</span> <span className="text-[#2A3547]">· {m.slots.map((s) => SLOT[s]).join(' + ')}</span></li>
                  ))}
                </ul>
              </div>
            </div>
            <div ref={stripRef} className="relative mx-5 mb-5 flex items-center gap-3 overflow-hidden rounded-[10px] border border-[#F0D3B0] bg-caution-soft px-4 py-3 md:mx-7">
              <span className="absolute inset-0 rounded-[10px] ring-2 ring-inset ring-safe" style={{ opacity: strip }} />
              <span className="size-2 shrink-0 rounded-full bg-caution" />
              <span className="text-[14px] font-semibold leading-[18px] text-black">Safety</span>
              <span className="min-w-0 flex-1 truncate text-[14px] leading-[18px] text-[#6E3203]">Furosemide + Lisinopril · Moderate</span>
            </div>
          </div>

          {/* Overlay: pills + cursor */}
          {pts && PILLS.map(([label, bg, a, b, ox, oy], i) => {
            const o = reduced ? 1 : show(t, a, b);
            const [x, y] = pts[i + 1];
            return (
              <span key={label} className={`pointer-events-none absolute left-0 top-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-semibold leading-4 text-white shadow-[0_8px_20px_#0F1B2D29] ${bg}`}
                style={{ opacity: o, transform: `translate(${x + ox}px, ${y + oy}px) scale(${0.96 + 0.04 * o})`, transformOrigin: 'left top' }}>{label}</span>
            );
          })}
          {cursorOn && (
            <>
              {ripple.map((r, i) => r > 0 && r < 1 && (
                <span key={i} className="pointer-events-none absolute left-0 top-0 size-8 rounded-full border-2 border-primary"
                  style={{ opacity: 1 - r, transform: `translate(${pts[i + 1][0] - 16}px, ${pts[i + 1][1] - 16}px) scale(${0.3 + r})` }} />
              ))}
              <svg width="22" height="22" viewBox="0 0 24 24" className="pointer-events-none absolute left-0 top-0 drop-shadow-[0_2px_3px_#0F1B2D40]"
                style={{ transform: `translate(${cx - 3}px, ${cy - 2}px)` }}>
                <path d="M4 3l15 7.5-6.5 1.8L10 19z" fill="#0F1B2D" stroke="#FFFFFF" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </>
          )}
        </div>
      </div>
      {!reduced && (
        <div className="mt-3 flex justify-end">
          <button type="button" onClick={() => setPaused((p) => !p)} aria-pressed={paused} aria-label={paused ? 'Play demo' : 'Pause demo'}
            className="grid size-8 place-items-center rounded-[8px] border border-line bg-white transition-[translate,border-color] duration-[160ms] hover:-translate-y-px hover:border-control">
            <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
              {paused ? <path d="M7 4l13 8-13 8z" fill="#0F1B2D" /> : <><rect x="6" y="4" width="4" height="16" rx="1" fill="#0F1B2D" /><rect x="14" y="4" width="4" height="16" rx="1" fill="#0F1B2D" /></>}
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
