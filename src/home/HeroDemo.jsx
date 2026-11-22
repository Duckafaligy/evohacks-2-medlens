// Hero product-window demo: one 12s timeline (rAF clock → t), five scenes derived from t.
// Seekable (step row, window.__medlensDemoSeek), pauses off-screen / tab hidden / hover / button.
// Reduced motion: static scenes, step row still switches them. Transforms + opacity only.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Lock, Pause, Play } from 'lucide-react';
import { SCENARIOS } from '../data/scenarios.js';
import { fkGrade } from '../lib/readability.js';

const CARDIAC = SCENARIOS[0];
const G0 = Math.round(fkGrade(CARDIAC.raw));
const G1 = Math.max(1, Math.round(fkGrade(CARDIAC.meds.map((m) => m.plain.en).join(' '))));
const LINES = CARDIAC.raw.split('\n').filter((l) => /\bmg\b/.test(l))
  .map((l) => (l.match(/^.*?\b(QD|BID|TID|QID|QHS|q\d+h)\b/) || [l])[0]);
const CODES = ['PO', 'QD', 'BID', 'QHS'];
const TOKENS = LINES.map((l) => l.split(/(\b(?:PO|QD|BID|QHS)\b)/).filter(Boolean));

const LOOP = 12;
const SCENES = [['Scan', 0, 1.9], ['Read', 2, 4.3], ['Translate', 4.5, 6.9], ['Plan', 7, 9.6], ['Check', 10, 11.3]]; // [label, start, rest frame]
const sceneAt = (t) => SCENES.reduce((i, s, k) => (t >= s[1] ? k : i), 0);
const clamp = (x) => Math.min(1, Math.max(0, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = (p) => 1 - (1 - p) ** 3; // close to cubic-bezier(0.2,0,0,1)
const fade = (t, a, d = 0.24) => ease(seg(t, a, a + d));

const PLAN = [
  ['8:00 AM', 'Furosemide 40 · Lisinopril 10 · Metformin 500', '#1849A9'],
  ['6:00 PM', 'Metformin 500', '#12704F'],
  ['9:00 PM', 'Atorvastatin 20', '#4A5A72'],
];

const reducedMQ = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function HeroDemo() {
  const [reduced] = useState(reducedMQ);
  const [t, setT] = useState(reduced ? SCENES[3][2] : 0);
  const [paused, setPaused] = useState(false); // the button
  const [hover, setHover] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [tabHidden, setTabHidden] = useState(false);
  const tRef = useRef(t);
  const rootRef = useRef(null);
  const bidRef = useRef(null);
  const cardRef = useRef(null);
  const [path, setPath] = useState('');

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
    const el = rootRef.current;
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting)) : null;
    io?.observe(el);
    const vis = () => setTabHidden(document.hidden);
    document.addEventListener('visibilitychange', vis);
    window.__medlensDemoSeek = (v) => { setPaused(true); seek(v); };
    return () => { io?.disconnect(); document.removeEventListener('visibilitychange', vis); delete window.__medlensDemoSeek; };
  }, [seek]);

  // Connector geometry: measured once per resize (no per-frame layout reads).
  useLayoutEffect(() => {
    const measure = () => {
      const r = rootRef.current?.getBoundingClientRect(); const a = bidRef.current?.getBoundingClientRect(); const b = cardRef.current?.getBoundingClientRect();
      if (!r || !a || !b) return;
      const side = b.left > a.right; // desktop: panes side by side
      const x1 = side ? a.right - r.left + 4 : a.left + a.width / 2 - r.left; const y1 = side ? a.top + a.height / 2 - r.top : a.bottom - r.top + 2;
      const x2 = side ? b.left - r.left - 2 : b.left + 24 - r.left; const y2 = side ? b.top + 28 - r.top : b.top - r.top - 2;
      const mx = (x1 + x2) / 2; const my = (y1 + y2) / 2;
      setPath(side ? `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}` : `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`);
    };
    measure();
    document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(measure); ro.observe(rootRef.current);
    return () => ro.disconnect();
  }, []);

  const scene = sceneAt(t);
  // Scene 1 ↔ loop crossfade
  const wrapIn = fade(t, 11.6, 0.4);
  const s1 = t < 2.5 ? 1 - fade(t, 2, 0.4) : wrapIn;
  const notePane = t < 2.5 ? fade(t, 2, 0.4) : 1 - wrapIn;
  const tilt = (1 - ease(seg(t, 2, 2.5))) * -4 * (t < 2.5 ? 1 : 0);
  const scanP = seg(t, 0.15, 1.85);
  const hl = (code) => fade(t, 2.4 + CODES.indexOf(code) * 0.45, 0.2) * (1 - wrapIn);
  const right3 = t < 7 ? fade(t, 4.5) : 1 - fade(t, 7, 0.24);
  const line = ease(seg(t, 4.6, 5.3)) * (t < 7 ? 1 : 1 - fade(t, 7, 0.24));
  const pop = fade(t, 5.2, 0.24);
  const gp = ease(seg(t, 5.5, 6.4));
  const grade = Math.round(G0 + (G1 - G0) * gp);
  const planIn = (i) => fade(t, 7.1 + i * 0.06) * (1 - wrapIn);
  const tick = ease(seg(t, 8.2, 8.6));
  const check = fade(t, 10, 0.28) * (1 - wrapIn);
  const amber = ease(seg(t, 10.3, 10.7));
  const waiting = t < 4.5 ? 1 - fade(t, 4.3, 0.2) : wrapIn;

  return (
    <div className="mx-auto max-w-[1120px]">
      <div ref={rootRef} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        className="relative flex flex-col overflow-hidden rounded-[14px] border border-line bg-surface text-left" style={{ boxShadow: '0 -8px 40px #1849A91A' }}>
        <div className="flex h-10 shrink-0 items-center gap-2 border-b border-[#EDF0F4] px-4" aria-hidden="true">
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <span key={c} className="size-2.5 shrink-0 rounded-full" style={{ background: c, boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,.18)' }} />)}
          <span className="flex flex-1 justify-center pr-[54px]">
            <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-md bg-canvas px-3 py-[3px] text-[13px] leading-4 text-ink-2">
              <Lock className="size-3 shrink-0" />medlens.app/translate
            </span>
          </span>
        </div>

        <div className="flex flex-col md:flex-row" aria-hidden="true">
          {/* Left pane: label → note */}
          <div className="relative h-[230px] flex-1 border-b border-[#EDF0F4] md:h-[300px] md:border-b-0 md:border-r">
            <div className="absolute inset-0 flex items-center justify-center p-6" style={{ opacity: s1 }}>
              <div className="relative w-full max-w-[340px] overflow-hidden rounded-[10px] border border-[#E7DFC9] bg-[#FFFDF7] p-5 shadow-[0_12px_28px_#0F1B2D1F]"
                style={{ transform: `rotate(${t < 2.5 ? tilt : -4}deg)` }}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-2">Rx · Harold M.</p>
                {LINES.map((l) => <p key={l} className="font-mono text-[14px] leading-[24px] text-black md:text-[15px] md:leading-[26px]">{l}</p>)}
                <span className="absolute inset-x-0 top-0 h-[3px] bg-primary shadow-[0_0_12px_#1849A9]" style={{ transform: `translateY(${scanP * 150}px)`, opacity: t < 1.95 ? 1 : 0 }} />
              </div>
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-ink px-3 py-1 text-[13px] font-semibold leading-4 text-white">
                Reading label… {Math.round(scanP * 100)}%
              </span>
            </div>
            <div className="absolute inset-0 flex flex-col gap-4 px-6 py-7 md:px-8" style={{ opacity: notePane }}>
              <p className="text-[15px] leading-[18px] text-ink-2">What the label says</p>
              <div className="font-mono text-[15px] leading-[28px] text-black md:text-[19px] md:leading-[36px]">
                {TOKENS.map((parts, n) => (
                  <p key={n} className="whitespace-pre">{parts.map((p, k) => CODES.includes(p) ? (
                    <span key={k} ref={p === 'BID' ? bidRef : undefined} className="relative rounded-[4px] px-[2px] text-primary underline decoration-1 underline-offset-[5px]">
                      <span className="absolute inset-0 rounded-[4px] bg-primary-soft" style={{ opacity: hl(p) }} />
                      <span className="relative">{p}</span>
                    </span>
                  ) : <span key={k}>{p}</span>)}</p>
                ))}
              </div>
            </div>
          </div>

          {/* Right pane: meaning → plan → check */}
          <div className="relative h-[250px] flex-1 md:h-[300px]">
            <div className="absolute inset-0 flex flex-col gap-3 px-6 py-7 md:px-8" style={{ opacity: waiting }}>
              <p className="text-[15px] leading-[18px] text-ink-2">What it means</p>
              {[70, 90, 55].map((w) => <span key={w} className="h-3 rounded-full bg-canvas" style={{ width: `${w}%` }} />)}
            </div>
            <div className="absolute inset-0 flex flex-col gap-3.5 px-6 py-7 md:px-8" style={{ opacity: right3 }}>
              <p className="text-[15px] leading-[18px] text-ink-2">What it means</p>
              <div ref={cardRef} className="flex flex-col gap-1 rounded-[10px] bg-primary-soft p-4" style={{ opacity: pop, transform: `scale(${0.96 + 0.04 * pop})`, transformOrigin: 'left center' }}>
                <span className="font-mono text-[14px] leading-[18px] text-primary">BID</span>
                <span className="text-[22px] font-semibold leading-[28px] text-black">Twice a day</span>
              </div>
              <div className="flex flex-col gap-2 rounded-[10px] bg-[#F1F9F4] px-3.5 py-3" style={{ opacity: fade(t, 5.4) }}>
                <p className="flex justify-between text-[14px] leading-[18px] text-ink-2">Reading level <span className="font-semibold text-safe">Grade {grade}</span></p>
                <span className="h-1.5 rounded-full bg-[#D5EBDF]"><span className="block h-1.5 origin-left rounded-full bg-safe" style={{ transform: `scaleX(${(G0 - (G0 - G1) * gp) / G0})` }} /></span>
              </div>
            </div>
            <div className="absolute inset-0 flex flex-col gap-2.5 px-6 py-6 md:px-8 md:py-7">
              <p className="text-[15px] leading-[18px] text-ink-2" style={{ opacity: planIn(0) }}>Today’s plan</p>
              {PLAN.map(([time, meds, c], i) => (
                <div key={time} className="flex items-center gap-3 rounded-[10px] border border-line bg-white px-3.5 py-2.5"
                  style={{ opacity: planIn(i), transform: `translateY(${(1 - planIn(i)) * 8}px)`, borderLeft: `4px solid ${c}` }}>
                  <span className="w-[68px] shrink-0 text-[15px] font-semibold leading-[18px]" style={{ color: c }}>{time}</span>
                  <span className="min-w-0 flex-1 truncate text-[14px] leading-[18px] text-black">{meds}</span>
                  {i === 0 && (
                    <svg width="22" height="22" viewBox="0 0 24 24" className="shrink-0">
                      <circle cx="12" cy="12" r="10" fill="#12704F" style={{ transform: `scale(${tick})`, transformOrigin: 'center', transformBox: 'fill-box' }} />
                      <circle cx="12" cy="12" r="10" fill="none" stroke="#C5CEDA" strokeWidth="2" style={{ opacity: 1 - tick }} />
                      <path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - ease(seg(t, 8.4, 8.8))} />
                    </svg>
                  )}
                </div>
              ))}
            </div>
            <div className="absolute inset-x-6 bottom-5 flex flex-col gap-2 rounded-[10px] border border-[#F0D3B0] bg-caution-soft p-3.5 shadow-[0_12px_28px_#0F1B2D1F] md:inset-x-8 md:bottom-7"
              style={{ opacity: check, transform: `translateX(${(1 - check) * 16}px)` }}>
              <div className="flex items-center gap-2">
                <span className="rounded-[6px] bg-caution px-2 py-[3px] text-[12px] font-semibold leading-4 text-white">Moderate</span>
                <span className="text-[15px] font-semibold leading-[18px] text-black">Furosemide + Lisinopril</span>
              </div>
              <p className="text-[14px] leading-[18px] text-[#6E3203]">May cause dizziness</p>
              <span className="h-1.5 rounded-full bg-[#F0D3B0]"><span className="block h-1.5 origin-left rounded-full bg-caution" style={{ transform: `scaleX(${amber * 0.6})` }} /></span>
            </div>
          </div>
        </div>

        {path && (
          <svg className="pointer-events-none absolute inset-0 size-full overflow-visible" aria-hidden="true">
            <path d={path} fill="none" stroke="#1849A9" strokeWidth="2" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - line} style={{ opacity: line > 0 ? 1 : 0 }} />
          </svg>
        )}
        <p className="sr-only" aria-live="polite">{`Demo step: ${SCENES[scene][0]}`}</p>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        <ol className="flex flex-wrap justify-center gap-1" aria-label="Demo steps">
          {SCENES.map(([label, start, rest], i) => (
            <li key={label}>
              <button type="button" onClick={() => seek(reduced || paused ? rest : start)} aria-current={scene === i ? 'step' : undefined}
                className={`rounded-full px-3 py-1.5 text-[14px] font-semibold leading-[18px] transition-colors duration-[160ms] ${scene === i ? 'bg-primary text-white' : 'text-ink-2 hover:bg-primary-soft hover:text-primary'}`}>
                {label}
              </button>
            </li>
          ))}
        </ol>
        {!reduced && (
          <button type="button" onClick={() => setPaused((p) => !p)} aria-pressed={paused} aria-label={paused ? 'Play demo' : 'Pause demo'}
            className="grid size-9 place-items-center rounded-full border border-line bg-white text-ink transition-colors duration-[160ms] hover:border-control">
            {paused ? <Play className="size-4" aria-hidden="true" /> : <Pause className="size-4" aria-hidden="true" />}
          </button>
        )}
      </div>
    </div>
  );
}
