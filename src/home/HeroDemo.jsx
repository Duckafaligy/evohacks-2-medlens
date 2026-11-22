// Hero product window (Paper 73G-0): ONE stable Translate screen that a cursor actually uses.
// A scripted "person" hovers PO, taps BID, glances at the plain list, checks the grade, opens the
// Safety strip and leaves. Moves follow arced cubic Béziers timed by distance (Fitts-like) with a tiny
// overshoot; everything is derived from one rAF clock t (seekable). Pauses on hover, off-screen,
// hidden tab and via the chrome button. Reduced motion: the screen at rest with all three callouts.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { SCENARIOS } from '../data/scenarios.js';
import { fkGrade } from '../lib/readability.js';

const CARDIAC = SCENARIOS[0];
const G0 = Math.round(fkGrade(CARDIAC.raw));
const G1 = Math.max(1, Math.round(fkGrade(CARDIAC.meds.map((m) => m.plain.en).join(' '))));
const U = 'text-primary underline decoration-1';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = (p) => 1 - (1 - p) ** 3; // ≈ cubic-bezier(0.2,0,0,1)
const inOut = (p) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);
const fade = (t, a, d = 0.2) => ease(seg(t, a, a + d));
const on = (t, a, b, d = 0.2) => fade(t, a, d) * (1 - fade(t, b, d)); // in at a, out at b
const bump = (t, a, d) => Math.sin(Math.PI * seg(t, a, a + d)); // 0 → 1 → 0
const ARROW = 'M4 2l16 9-7 2-3 7z';
const TIP = [3, 1.5]; // arrow tip inside the 18px cursor box
const PILLS = [['Tapping a medical word', '#1849A9'], ['Reading level drops', '#A14A06'], ['Checking the FDA label', '#12704F']];

function rng(seed) { // mulberry32: same "random" arcs every loop so seeking is deterministic
  return () => { seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
}

/** Build the ~16s script from measured points. Returns moves (cursor path) and named times T. */
function buildScript(P) {
  const r = rng(7); const moves = []; const T = {};
  let t = 0; let pos = P.enter;
  const move = (to) => {
    const d = Math.hypot(to[0] - pos[0], to[1] - pos[1]);
    const dur = clamp(0.45 + 0.0009 * d, 0.5, 1.3);
    moves.push({ t0: t, t1: t + dur, a: pos, b: to, off: (0.08 + r() * 0.12) * (r() < 0.5 ? -1 : 1) });
    t += dur; pos = to; return t;
  };
  const dwell = (s) => { moves.push({ t0: t, t1: t + s, a: pos, b: pos, dwell: true }); t += s; return t; };
  T.po = move(P.po); T.poOut = dwell(0.6);
  T.bid = move(P.bid); dwell(2);
  T.row = move(P.row); T.rowOut = dwell(0.6);
  T.chip = move(P.chip); T.chipOut = dwell(2);
  T.strip = move(P.strip); T.click = dwell(0.6); T.stripOut = dwell(2.2);
  T.today = move(P.today); T.todayOut = dwell(0.8);
  T.exit = move(P.exit);
  T.reset = t + 0.2;
  return { moves, T, loop: T.reset + 0.6 };
}

function cursorAt(S, t) {
  const m = S.moves.find((x) => t >= x.t0 && t < x.t1) || S.moves[S.moves.length - 1];
  if (m.dwell) { // idle micro-drift, eased in
    const w = seg(t, m.t0, m.t0 + 0.3);
    return [m.a[0] + 1.5 * Math.sin(t * 1.3) * w, m.a[1] + 1.5 * Math.sin(t * 1.7 + 1) * w];
  }
  const p = seg(t, m.t0, m.t1); const u = inOut(p);
  const [ax, ay] = m.a; const [bx, by] = m.b; const dx = bx - ax; const dy = by - ay; const d = Math.hypot(dx, dy) || 1;
  const nx = -dy / d; const ny = dx / d; const k = d * m.off; // perpendicular arc
  const c1 = [ax + dx / 3 + nx * k, ay + dy / 3 + ny * k]; const c2 = [ax + (2 * dx) / 3 + nx * k, ay + (2 * dy) / 3 + ny * k];
  const v = 1 - u;
  const x = v ** 3 * ax + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u ** 3 * bx;
  const y = v ** 3 * ay + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u ** 3 * by;
  const o = 2.5 * Math.sin(Math.PI * seg(p, 0.82, 1)); // overshoot past the target, then settle
  return [x + (dx / d) * o, y + (dy / d) * o];
}

const reducedMQ = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

export default function HeroDemo() {
  const [reduced] = useState(reducedMQ);
  const [t, setT] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [tabHidden, setTabHidden] = useState(false);
  const [S, setS] = useState(null); // script built from measured points
  const tRef = useRef(0);
  const loopRef = useRef(16);
  const winRef = useRef(null);
  const poRef = useRef(null);
  const bidRef = useRef(null);
  const rowRef = useRef(null);
  const chipRef = useRef(null);
  const stripRef = useRef(null);
  const todayRef = useRef(null);
  const crumbRef = useRef(null);

  const seek = useCallback((v) => { const L = loopRef.current; tRef.current = ((v % L) + L) % L; setT(tRef.current); }, []);
  const running = !reduced && !paused && !hover && onScreen && !tabHidden && !!S;

  useEffect(() => {
    if (!running) return undefined;
    let raf; let last = performance.now();
    const tick = (now) => {
      tRef.current = (tRef.current + Math.min(0.05, (now - last) / 1000)) % loopRef.current;
      last = now; setT(tRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  useEffect(() => {
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting)) : null;
    io?.observe(winRef.current);
    const vis = () => setTabHidden(document.hidden);
    document.addEventListener('visibilitychange', vis);
    window.__medlensDemoSeek = (v) => { setPaused(true); seek(v); };
    return () => { io?.disconnect(); document.removeEventListener('visibilitychange', vis); delete window.__medlensDemoSeek; };
  }, [seek]);

  // Waypoints: measured from the real elements on resize / font load (never per frame).
  useLayoutEffect(() => {
    const refs = { po: poRef, bid: bidRef, row: rowRef, chip: chipRef, strip: stripRef, today: todayRef, crumb: crumbRef };
    const measure = () => {
      const r = winRef.current?.getBoundingClientRect(); if (!r) return;
      const box = (k) => { const b = refs[k].current?.getBoundingClientRect(); return b && b.width ? b : null; };
      const pt = (k, fx, fy) => { const b = box(k); return b && [b.left - r.left + b.width * fx - TIP[0], b.top - r.top + b.height * fy - TIP[1]]; };
      const P = {
        enter: [r.width + 10, r.height - 30], po: pt('po', 0.55, 0.6), bid: pt('bid', 0.5, 0.65), row: pt('row', 0.35, 0.6),
        chip: pt('chip', 0.45, 0.65), strip: pt('strip', 0.35, 0.5), today: pt('today', 0.3, 0.55) || pt('crumb', 0.2, 0.6), exit: [r.width - 24, -24],
      };
      if (Object.values(P).every(Boolean)) { const s = { ...buildScript(P), w: r.width }; loopRef.current = s.loop; setS(s); }
    };
    measure();
    document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(measure); ro.observe(winRef.current);
    return () => ro.disconnect();
  }, []);

  // ---- UI state derived from t (all 160–240ms crossfades)
  const T = S?.T; const live = !reduced && T;
  const poHover = live ? on(t, T.po - 0.1, T.poOut) : 0;
  const cardPO = live ? on(t, T.po - 0.05, T.bid, 0.24) : 0;
  const bidSel = live ? on(t, T.bid, T.reset, 0.24) : 1;
  const rowTint = live ? on(t, T.row - 0.05, T.rowOut) : 0;
  const chipHover = live ? on(t, T.chip - 0.05, T.chipOut, 0.16) : 0;
  const grade = live && t >= T.chip && t < T.chip + 0.9 ? Math.round(G0 + (G1 - G0) * ease(seg(t, T.chip, T.chip + 0.9))) : G1;
  const stripHover = live ? on(t, T.strip - 0.05, T.stripOut, 0.16) : 0;
  const stripOpen = live ? on(t, T.click + 0.06, T.reset, 0.24) : 0;
  const todayTint = live ? on(t, T.today - 0.05, T.todayOut, 0.16) : 0;
  const pill = live ? [on(t, T.bid + 0.05, T.chip - 0.1), on(t, T.chip, T.strip - 0.1), on(t, T.strip, T.exit - 0.3)] : [1, 1, 1];
  const [cx, cy] = S && live ? cursorAt(S, t) : [0, 0];
  const cursorO = live ? fade(t, 0, 0.3) * (1 - fade(t, T.exit - 0.3, 0.3)) : 0;
  const press = live ? Math.max(bump(t, T.bid, 0.12), bump(t, T.click, 0.12)) : 0;
  const ripples = live ? [T.bid, T.click].map((a) => seg(t, a, a + 0.3)) : [];
  const spot = S ? { bid: S.moves.find((m) => m.t1 === T.bid).b, chip: S.moves.find((m) => m.t1 === T.chip).b, strip: S.moves.find((m) => m.t1 === T.strip).b } : null;
  const tint = (o) => ({ background: `rgba(232,239,251,${o})` });

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
            {[['Today'], ['Translate', null, true], ['Safety', 1], ['My medicines', CARDIAC.meds.length], ['Calendar']].map(([l, n, act]) => (
              <span key={l} ref={l === 'Today' ? todayRef : undefined}
                className={`flex h-8 shrink-0 items-center justify-between rounded-[6px] px-2 text-[13px] leading-4 ${act ? 'bg-primary-soft font-semibold text-primary' : 'text-[#2A3547]'}`}
                style={l === 'Today' ? { background: `rgba(244,246,249,${todayTint})` } : undefined}>
                {l}
                {l === 'Safety' && <span className="rounded-[5px] bg-danger px-1.5 text-[11px] font-semibold leading-[14px] text-white">{n}</span>}
                {l === 'My medicines' && <span className="text-[12px] leading-4 text-ink-2">{n}</span>}
              </span>
            ))}
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex min-h-[46px] shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#EDF0F4] px-5 py-2">
              <p ref={crumbRef} className="text-[13px] leading-4 text-ink-2">Translate / <span className="font-semibold text-ink">Harold’s discharge note</span></p>
              <span ref={chipRef} className="rounded-[6px] bg-[#F1F9F4] px-2.5 py-[3px] text-[12px] font-semibold leading-4 text-black will-change-transform"
                style={{ transform: `translate3d(0,${-chipHover}px,0)`, boxShadow: `0 ${2 * chipHover}px ${6 * chipHover}px rgba(15,27,45,${0.12 * chipHover})` }}>
                <span className="text-danger">Grade {G0}</span> → <span className="tabular-nums text-safe">Grade {grade}</span>
              </span>
            </div>
            <div className="flex flex-1 flex-col md:flex-row">
              <div className="flex flex-1 basis-0 flex-col gap-2.5 border-b border-[#EDF0F4] p-5 md:border-b-0 md:border-r">
                <p className="text-[12px] leading-4 text-ink-2">What the doctor wrote</p>
                <p className="whitespace-pre-wrap font-mono text-[13px] leading-7 text-black md:text-[14px]">
                  Furosemide 40 mg <span ref={poRef} className={`${U} rounded-[3px]`} style={tint(0.9 * poHover)}>PO</span> <span className={U}>QD</span>{'\n'}
                  Lisinopril 10 mg <span className={U}>PO</span> <span className={U}>QD</span>{'\n'}
                  Metformin 500 mg <span className={U}>PO</span> <span ref={bidRef} className={`${U} rounded-[3px] font-semibold`} style={tint(bidSel)}>BID</span> c meals{'\n'}
                  Atorvastatin 20 mg <span className={U}>PO</span> <span className={U}>QHS</span>{'\n'}
                  <span className="text-ink-2">Hold lisinopril if </span><span className={U}>SBP</span><span className="text-ink-2"> &lt; 100</span>{'\n'}
                  <span className="text-ink-2">Daily wt. F/u cardiology 1 wk.</span>
                </p>
              </div>
              <div className="flex flex-[1.1] basis-0 flex-col gap-2.5 p-5">
                <p className="text-[12px] leading-4 text-ink-2">In plain words</p>
                <div className="grid rounded-[10px] border border-[#C9D8F5] bg-primary-soft px-3.5 py-3">
                  <div className="flex flex-col gap-[3px] [grid-area:1/1]" style={{ opacity: 1 - cardPO }}>
                    <span className="font-mono text-[12px] leading-4 text-primary">BID</span>
                    <span className="text-[17px] font-semibold leading-[22px] text-black">Twice a day</span>
                    <span className="text-[12px] leading-4 text-[#2A3547]">On your list: Metformin 500 mg</span>
                  </div>
                  <div className="flex flex-col gap-[3px] [grid-area:1/1]" style={{ opacity: cardPO }}>
                    <span className="font-mono text-[12px] leading-4 text-primary">PO</span>
                    <span className="text-[17px] font-semibold leading-[22px] text-black">By mouth</span>
                    <span className="text-[12px] leading-4 text-[#2A3547]">Swallow it with water</span>
                  </div>
                </div>
                <div className="flex flex-col gap-[3px] text-[13px] leading-4 text-black">
                  <p className="-mx-1.5 rounded-[6px] px-1.5 py-0.5"><span className="font-semibold">Furosemide</span> · 1 pill each morning</p>
                  <p className="-mx-1.5 rounded-[6px] px-1.5 py-0.5"><span className="font-semibold">Lisinopril</span> · 1 pill each morning</p>
                  <p ref={rowRef} className="-mx-1.5 rounded-[6px] px-1.5 py-0.5" style={tint(rowTint)}><span className="font-semibold">Metformin</span> · with breakfast and dinner</p>
                  <p className="-mx-1.5 rounded-[6px] px-1.5 py-0.5"><span className="font-semibold">Atorvastatin</span> · at bedtime</p>
                  <p className="pt-1.5 text-ink-2">Skip lisinopril if your top blood pressure number is under 100.</p>
                </div>
              </div>
            </div>
            <div ref={stripRef} className="relative shrink-0 border-t border-[#EDF0F4] bg-caution-soft px-5 py-2">
              <span className="pointer-events-none absolute inset-0 border border-caution" style={{ opacity: 0.55 * stripHover }} />
              <div className="flex min-h-8 flex-wrap items-center gap-x-2.5 gap-y-1">
                <svg width="16" height="16" viewBox="0 0 24 24" className="shrink-0">
                  <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" fill="none" stroke="#A14A06" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 9v4M12 17h.01" fill="none" stroke="#A14A06" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[13px] font-semibold leading-4 text-black">Furosemide + Lisinopril</span>
                <span className="rounded-[5px] bg-caution px-[7px] py-px text-[11px] font-semibold leading-[14px] text-white">Moderate</span>
                <span className="text-[12px] leading-4 text-[#6E3203]">May cause dizziness</span>
              </div>
              <div className="grid" style={{ gridTemplateRows: `${stripOpen}fr` }}>
                <p className="min-h-0 overflow-hidden pl-[26px] text-[12px] leading-5 text-[#6E3203]" style={{ opacity: stripOpen }}>Source: FDA label · Stand up slowly</p>
              </div>
            </div>
          </div>
        </div>

        {/* Callout pills beside the spots the cursor uses; only one shows at a time. */}
        {spot && [spot.bid, spot.chip, spot.strip].map(([x, y], i) => (
          <span key={PILLS[i][0]} className="pointer-events-none absolute left-0 top-0 flex items-start gap-1 will-change-transform" aria-hidden="true"
            style={{ transform: `translate3d(${Math.min(x, S.w - 200)}px, ${y}px, 0)` }}>
            {reduced && <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0"><path d={ARROW} fill={PILLS[i][1]} stroke="#FFFFFF" strokeWidth="1.5" /></svg>}
            <span className="whitespace-nowrap rounded-[7px] px-2.5 py-[5px] text-[13px] font-semibold leading-4 text-white shadow-[0_6px_16px_#0F1B2D24]"
              style={{ background: PILLS[i][1], opacity: pill[i], transform: `translate3d(0,${(1 - pill[i]) * 4}px,0)`, marginLeft: reduced ? 0 : 22, marginTop: i === 2 ? -70 : 12 }}>{PILLS[i][0]}</span>
          </span>
        ))}
        {live && ripples.map((p, i) => p > 0 && p < 1 && (
          <span key={i} className="pointer-events-none absolute left-0 top-0 size-7 rounded-full border-2 border-primary" aria-hidden="true"
            style={{ opacity: 1 - p, transform: `translate3d(${(i ? spot.strip : spot.bid)[0] + TIP[0] - 14}px, ${(i ? spot.strip : spot.bid)[1] + TIP[1] - 14}px, 0) scale(${0.4 + 0.8 * p})` }} />
        ))}
        {live && (
          <svg width="18" height="18" viewBox="0 0 24 24" className="pointer-events-none absolute left-0 top-0 will-change-transform drop-shadow-[0_2px_3px_#0F1B2D33]" aria-hidden="true"
            style={{ opacity: cursorO, transform: `translate3d(${cx}px, ${cy}px, 0) scale(${1 - 0.1 * press})`, transformOrigin: '3px 1.5px' }}>
            <path d={ARROW} fill="#0F1B2D" stroke="#FFFFFF" strokeWidth="1.5" />
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
