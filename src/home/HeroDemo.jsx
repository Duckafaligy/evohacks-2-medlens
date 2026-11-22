// Hero product-window demo (Paper "Demo motion · frames" 6RN-0): one 12s timeline (rAF clock → t),
// five scenes derived from t. Seekable (step row, window.__medlensDemoSeek), pauses off-screen /
// tab hidden / hover / button. Reduced motion: static scenes, step row still switches them.
// Animates transforms + opacity only; layout is read once per resize for the connector.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { SCENARIOS } from '../data/scenarios.js';
import { fkGrade } from '../lib/readability.js';

const CARDIAC = SCENARIOS[0];
const G0 = Math.round(fkGrade(CARDIAC.raw));
const G1 = Math.max(1, Math.round(fkGrade(CARDIAC.meds.map((m) => m.plain.en).join(' '))));
const LINES = CARDIAC.raw.split('\n').filter((l) => /\bmg\b/.test(l))
  .map((l) => (l.match(/^.*?\b(QD|BID|TID|QID|QHS|q\d+h)\b/) || [l])[0]);
const CODE_RE = /^(PO|QD|BID|QHS)$/;
const ROWS = LINES.map((l) => { const w = l.split(' '); const i = w.findIndex((x) => CODE_RE.test(x)); return [w.slice(0, i).join(' '), w.slice(i)]; });
const TOKENS = ROWS.flatMap(([, codes], r) => codes.map((c, k) => `${r}-${k}`)); // light-up order
const SHORT = LINES.map((l) => l.replace(' mg', ''));

const LOOP = 12;
const SCENES = [['Scan', 0, 1.9, 'scan'], ['Read', 2, 4.4, 'translate'], ['Translate', 4.5, 6.9, 'translate'], ['Plan', 7, 9.8, 'today'], ['Check', 10, 11.4, 'today']];
const sceneAt = (t) => SCENES.reduce((i, s, k) => (t >= s[1] ? k : i), 0);
const clamp = (x) => Math.min(1, Math.max(0, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = (p) => 1 - (1 - p) ** 3; // ≈ cubic-bezier(0.2,0,0,1)
const fade = (t, a, d = 0.24) => ease(seg(t, a, a + d));

const PLAN = [
  ['8:00 AM · 3 pills', 'Furosemide · Lisinopril · Metformin', '#1849A9', '#E8EFFB', 1],
  ['6:00 PM · 1 pill', 'Metformin with dinner', '#12704F', '#E5F3EC', 1],
  ['9:00 PM · 1 pill', 'Atorvastatin at bedtime', '#4A5A72', '#EEF0F4', 0.7],
];
const MONO = 'font-mono text-[15px] leading-[18px]';
const CAP = 'text-[13px] leading-4 text-ink-2';

const reducedMQ = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function HeroDemo() {
  const [reduced] = useState(reducedMQ);
  const [t, setT] = useState(reduced ? SCENES[3][2] : 0);
  const [paused, setPaused] = useState(false);
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

  // Connector geometry: measured on resize / font load only.
  useLayoutEffect(() => {
    const measure = () => {
      const r = rootRef.current?.getBoundingClientRect(); const a = bidRef.current?.getBoundingClientRect(); const b = cardRef.current?.getBoundingClientRect();
      if (!r || !a || !b || !a.width) return;
      const y = a.top + a.height / 2 - r.top; // side-by-side panes only; stacked (mobile) has no connector
      setPath(b.left > a.right ? `M${a.right - r.left + 6},${y} H${b.left - r.left}` : '');
    };
    measure();
    document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(measure); ro.observe(rootRef.current);
    return () => ro.disconnect();
  }, []);

  const scene = sceneAt(t);
  const wrap = fade(t, 11.6, 0.4); // fade everything back to F1
  const scanL = t < 2.4 ? 1 - fade(t, 2, 0.4) : wrap;
  const cardIn = t < 2.4 ? fade(t, 0, 0.32) : 1;
  const untilt = ease(seg(t, 2, 2.4));
  const scanP = seg(t, 0.3, 1.7);
  const chipN = Math.round(ease(seg(t, 0.3, 1.9)) * 64);
  const layerA = t < 7 ? fade(t, 2, 0.4) : 1 - fade(t, 7, 0.32);
  const layerB = t < 7 ? 0 : fade(t, 7, 0.32) * (1 - wrap);
  const litK = TOKENS.map((_, k) => fade(t, 2.5 + k * 0.2));
  const found = litK.filter((v) => v > 0.5).length;
  const current = t < 4.5 ? Math.max(-1, Math.floor((t - 2.5) / 0.2)) : -1;
  const translate = fade(t, 4.5);
  const line = ease(seg(t, 4.5, 4.86));
  const pop = fade(t, 4.86);
  const gp = ease(seg(t, 5.2, 6.1));
  const grade = Math.round(G0 + (G1 - G0) * gp);
  const needle = 0.2 + ((grade - G1) / Math.max(1, G0 - G1)) * 0.75;
  const block = (i) => fade(t, 7.2 + i * 0.12, 0.28);
  const tick = fade(t, 9.2, 0.24);
  const check = fade(t, 10, 0.28);
  const amber = fade(t, 10.3, 0.4);
  const url = SCENES[scene][3];

  return (
    <div className="mx-auto max-w-[1120px]">
      <div ref={rootRef} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        className="relative flex flex-col overflow-hidden rounded-[14px] border border-line bg-surface text-left shadow-[0_12px_32px_#1849A914]">
        <div className="flex h-9 shrink-0 items-center gap-1.5 border-b border-[#EDF0F4] px-3.5" aria-hidden="true">
          {[0, 1, 2].map((i) => <span key={i} className="size-[9px] shrink-0 rounded-full bg-[#E5E7EB]" />)}
          <span className="flex flex-1 justify-center pr-[39px]">
            <span className="rounded-[6px] bg-canvas px-2.5 py-0.5 text-[12px] leading-4 text-ink-2">medlens.app/{url}</span>
          </span>
        </div>

        <div className="relative h-[520px] md:h-[340px]" aria-hidden="true">
          {/* F1 Scan */}
          <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(160deg,#EEF2F7_0%,#E3E9F1_100%)] p-4" style={{ opacity: scanL }}>
            <div className="relative flex w-full max-w-[320px] flex-col gap-2.5 rounded-[6px] bg-white px-5 py-[22px] md:max-w-[380px] md:px-6 shadow-[0_14px_30px_#0F1B2D2E]"
              style={{ opacity: cardIn, transform: `rotate(${-2 * (1 - untilt)}deg)` }}>
              <p className="text-[13px] font-semibold leading-4 text-ink-2">ST. MARY’S HOSPITAL · DISCHARGE</p>
              <div className="font-mono text-[14px] leading-6 text-black">{LINES.map((l) => <p key={l}>{l}</p>)}</div>
              <span className="h-1 w-[60%] rounded-[2px] bg-[#E5E7EB]" />
              <span className="absolute -inset-x-6 top-0 h-[3px] rounded-[2px] bg-primary shadow-[0_0_0_6px_#1849A91F]"
                style={{ transform: `translateY(${10 + scanP * 170}px)`, opacity: t < 1.8 ? 1 : 0 }} />
            </div>
            <span className="absolute left-5 top-[18px] flex items-center gap-2 rounded-[8px] border border-line bg-white px-3 py-1.5">
              <span className="h-[5px] w-[60px] overflow-hidden rounded-[3px] bg-primary-soft"><span className="block h-[5px] origin-left rounded-[3px] bg-primary" style={{ transform: `scaleX(${chipN / 100})` }} /></span>
              <span className="text-[13px] font-semibold leading-4 text-black">Reading label… {chipN}%</span>
            </span>
          </div>

          {/* F2–F3 Read / Translate */}
          <div className="absolute inset-0 flex flex-col md:flex-row" style={{ opacity: layerA }}>
            <div className="flex flex-1 basis-0 flex-col gap-3.5 border-b border-[#EDF0F4] p-5 md:border-b-0 md:border-r md:p-6">
              <p className={CAP}>What the label says</p>
              <div className="flex flex-col gap-3">
                {ROWS.map(([lead, codes], r) => {
                  const keep = r === 2; // the BID line stays dark in Translate
                  return (
                    <div key={r} className="flex flex-wrap items-center gap-1.5">
                      <span className={MONO} style={{ color: translate > 0.5 && !keep ? '#9AA4B2' : '#000' }}>{lead}</span>
                      {codes.map((c, k) => {
                        const idx = TOKENS.indexOf(`${r}-${k}`); const lit = litK[idx]; const solid = idx === current || (c === 'BID' && t >= 4.3);
                        const dim = translate > 0.5 && c !== 'BID';
                        return (
                          <span key={c + k} ref={c === 'BID' ? bidRef : undefined} className={`relative rounded-[5px] px-1.5 py-px ${MONO}`}>
                            <span className="absolute inset-0 rounded-[5px] border border-dashed border-[#9AA4B2]" style={{ opacity: (1 - lit) * (dim ? 0 : 1) }} />
                            <span className="absolute inset-0 rounded-[5px] bg-primary-soft" style={{ opacity: lit * (solid || dim ? 0 : 1) }} />
                            <span className="absolute inset-0 rounded-[5px] bg-primary" style={{ opacity: solid ? 1 : 0 }} />
                            <span className={`relative ${solid ? 'font-semibold text-white' : dim ? 'text-[#9AA4B2]' : lit > 0.5 ? 'font-semibold text-primary' : 'text-ink-2'}`}>{c}</span>
                          </span>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
              <p className={`pt-2 ${CAP}`} style={{ opacity: 1 - translate }}>{found} of {TOKENS.length} terms found{found < TOKENS.length ? '…' : '.'}</p>
            </div>
            <div className="relative flex flex-1 basis-0 flex-col gap-3.5 p-5 md:p-6">
              <p className={CAP}>What it means</p>
              <div className="flex flex-col gap-3" style={{ opacity: 1 - translate }}>
                <span className="h-14 rounded-[10px] bg-canvas" /><span className="h-4 w-[70%] rounded-[4px] bg-canvas" /><span className="h-4 w-[55%] rounded-[4px] bg-canvas" />
              </div>
              <div className="absolute inset-x-5 top-[46px] flex flex-col gap-3.5 md:inset-x-6 md:top-[52px]" style={{ opacity: translate }}>
                <div ref={cardRef} className="flex flex-col gap-1 rounded-[10px] bg-primary-soft p-4 shadow-[0_10px_24px_#1849A924]"
                  style={{ opacity: pop, transform: `scale(${0.96 + 0.04 * pop})`, transformOrigin: 'left center' }}>
                  <span className="font-mono text-[13px] leading-4 text-primary">BID</span>
                  <span className="text-[22px] font-semibold leading-7 text-black">Twice a day</span>
                  <span className="text-[14px] leading-[18px] text-[#2A3547]">Morning and evening, with meals</span>
                </div>
                <div className="flex flex-col gap-2 rounded-[10px] bg-[#F1F9F4] p-3.5" style={{ opacity: fade(t, 5.1) }}>
                  <p className="flex justify-between text-[13px] leading-4 text-ink-2">Reading level
                    <span className="text-black"><span className="text-danger">Grade {G0}</span> → <span className="font-semibold text-safe">Grade {grade}</span></span>
                  </p>
                  <span className="relative h-2 rounded-[4px] bg-[linear-gradient(90deg,#12704F_0%,#A14A06_50%,#B4232A_100%)]">
                    <span className="absolute inset-0" style={{ transform: `translateX(${needle * 100}%)` }}><span className="absolute -top-[5px] h-[18px] w-[5px] -translate-x-1/2 rounded-[3px] bg-ink" /></span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* F4–F5 Plan / Check */}
          <div className="absolute inset-0 flex flex-col md:flex-row" style={{ opacity: layerB }}>
            <div className="flex shrink-0 flex-col gap-3 border-b border-[#EDF0F4] p-5 md:w-[250px] md:border-b-0 md:border-r md:p-6">
              <p className={CAP}>Label</p>
              {SHORT.map((l, i) => (
                <p key={l} className={`font-mono text-[13px] leading-4 ${t >= 10 && i < 2 ? 'font-semibold text-caution' : 'text-[#9AA4B2]'}`}>{l}</p>
              ))}
            </div>
            <div className="flex flex-1 flex-col gap-2.5 p-5 md:p-6" style={{ opacity: 1 - check * 0.55 }}>
              <p className={CAP}>Your day</p>
              {PLAN.map(([title, sub, c, bg, op], i) => (
                <div key={title} className="flex items-center gap-3 rounded-[10px] px-3.5 py-3"
                  style={{ background: bg, borderLeft: `4px solid ${c}`, opacity: block(i) * op, transform: `translateY(${(1 - block(i)) * 12}px)` }}>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <p className="text-[15px] font-semibold leading-[18px]" style={{ color: c }}>{title}</p>
                    <p className="text-[13px] leading-4 text-black">{sub}</p>
                  </div>
                  <span className="relative size-[26px] shrink-0 rounded-[7px] border-2 border-[#9AA4B2]">
                    {i === 0 && (
                      <span className="absolute -inset-[2px] grid place-items-center rounded-[7px] bg-safe" style={{ opacity: tick, transform: `scale(${0.8 + 0.2 * tick})` }}>
                        <svg width="15" height="15" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - tick} /></svg>
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
            <div className="absolute inset-x-4 bottom-4 flex flex-col gap-3 rounded-[12px] border border-l-[5px] border-[#F0D3B0] border-l-caution bg-white p-5 shadow-[0_18px_40px_#0F1B2D29] md:inset-x-auto md:bottom-auto md:left-[290px] md:top-[110px] md:w-[400px]"
              style={{ opacity: check, transform: `translateX(${(1 - check) * 16}px)` }}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[18px] font-semibold leading-[22px] text-black">Furosemide + Lisinopril</p>
                <span className="rounded-[6px] bg-caution px-2 py-[3px] text-[12px] font-semibold leading-4 text-white">Moderate</span>
              </div>
              <div className="flex gap-1">
                {[0, 1].map((i) => <span key={i} className="h-1.5 flex-1 overflow-hidden rounded-[3px] bg-[#EDF0F4]"><span className="block h-1.5 origin-left bg-caution" style={{ transform: `scaleX(${clamp(amber * 2 - i)})` }} /></span>)}
                <span className="h-1.5 flex-1 rounded-[3px] bg-[#EDF0F4]" />
              </div>
              <p className="text-[15px] leading-[22px] text-black">May cause <em className="text-caution">dizziness</em> and low blood pressure. Stand up slowly.</p>
              <span className="self-start rounded-[6px] border border-[#BFE0E7] px-2 py-0.5 text-[12px] font-semibold leading-4 text-info">Source: FDA label</span>
            </div>
          </div>

          {path && (
            <svg className="pointer-events-none absolute inset-0 size-full overflow-visible" style={{ top: -36 }}>
              <path d={path} fill="none" stroke="#1849A9" strokeWidth="2" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - line} style={{ opacity: line > 0 ? layerA : 0 }} />
            </svg>
          )}
        </div>
        <p className="sr-only" aria-live="polite">{`Demo step: ${SCENES[scene][0]}`}</p>
      </div>

      <div className="mt-4 flex items-center gap-4">
        {!reduced && (
          <button type="button" onClick={() => setPaused((p) => !p)} aria-pressed={paused} aria-label={paused ? 'Play demo' : 'Pause demo'}
            className="grid size-9 shrink-0 place-items-center rounded-[9px] border-[1.5px] border-control bg-white transition-[translate,border-color] duration-[160ms] hover:-translate-y-px hover:border-ink-2">
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              {paused ? <path d="M7 4l13 8-13 8z" fill="#0F1B2D" /> : <><rect x="6" y="4" width="4" height="16" rx="1" fill="#0F1B2D" /><rect x="14" y="4" width="4" height="16" rx="1" fill="#0F1B2D" /></>}
            </svg>
          </button>
        )}
        <ol className="flex flex-1 gap-1.5" aria-label="Demo steps">
          {SCENES.map(([label, start, rest], i) => (
            <li key={label} className="flex-1">
              <button type="button" onClick={() => seek(reduced || paused ? rest : start)} aria-current={scene === i ? 'step' : undefined}
                className="group flex w-full flex-col gap-1.5 text-left">
                <span className={`h-1 w-full rounded-[2px] transition-colors duration-[160ms] ${scene === i ? 'bg-primary' : i < scene ? 'bg-[#9DB6E6]' : 'bg-line group-hover:bg-[#9DB6E6]'}`} />
                <span className={`text-[12px] leading-4 md:text-[13px] ${scene === i ? 'font-semibold text-primary' : 'text-ink-2 group-hover:text-primary'}`}>{label}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
