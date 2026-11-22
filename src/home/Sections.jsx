// Homepage sections (English copy). Composed in src/views/Home.jsx.
import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Lock } from 'lucide-react';
import { useApp } from '../components/ctx.js';
import { highlightTerms } from '../lib/parse.js';
import { fkGrade } from '../lib/readability.js';
import { SCENARIOS } from '../data/scenarios.js';
import { useCount, useReveal } from './reveal.js';

const CARDIAC = SCENARIOS[0];
const GRADE_BEFORE = Math.round(fkGrade(CARDIAC.raw));
const GRADE_AFTER = Math.max(1, Math.round(fkGrade(CARDIAC.meds.map((m) => m.plain.en).join(' '))));
const SLOT_WORDS = { morning: 'each morning', noon: 'at noon', evening: 'each evening', bedtime: 'at bedtime' };

const DOT_SHADOW = { boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,.18)' };
/* 1. Hero — ported from Paper "Homepage · Desktop" › Hero (2NS-0). */
const HERO_LINES = CARDIAC.raw.split('\n')
  .filter((l) => /\bmg\b/.test(l))
  .map((l) => (l.match(/^.*?\b(QD|BID|TID|QID|QHS|q\d+h)\b/) || [l])[0]);
const HERO_TERMS = HERO_LINES.flatMap((l) => highlightTerms(l)).map((s) => s.term).filter(Boolean);
const CYCLE = ['PO', 'QD', 'BID', 'QHS'].map((c) => HERO_TERMS.find((t) => t.term === c)).filter(Boolean);
const isCode = (t) => /^[A-Za-z]{2,4}$|^q\d+h$/.test(t.term) && t.category !== 'unit';

export function Hero() {
  const { tryExample } = useApp();
  const segs = HERO_LINES.map((l) => highlightTerms(l));
  const [term, setTerm] = useState(() => segs.flat().find((s) => s.term?.term === 'BID')?.term);
  const [auto, setAuto] = useState(true); // cycles PO → QD → BID → QHS every 2.8s until the user picks a word
  useEffect(() => {
    if (!auto || CYCLE.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const id = setInterval(() => setTerm((t) => CYCLE[(CYCLE.findIndex((c) => c.term === t?.term) + 1) % CYCLE.length]), 2800);
    return () => clearInterval(id);
  }, [auto]);
  const grade = useCount(GRADE_AFTER, true, { from: GRADE_BEFORE });
  return (
    <section aria-labelledby="hero-h" className="overflow-hidden px-4 pt-[104px] md:pt-[120px]"
      style={{ backgroundImage: 'linear-gradient(180deg, #FFFFFF 0%, #F3F7FD 70%, #EAF1FC 100%)' }}>
      <div className="mx-auto flex max-w-[1152px] flex-col items-center gap-[22px] pb-10 pt-6 text-center md:pt-14">
        <h1 id="hero-h" className="rise text-[44px] font-semibold leading-[48px] tracking-[-0.035em] text-black md:text-[72px] md:leading-[78px]">
          Understand every prescription.<br />
          <em className="text-primary">In plain words, in seconds.</em>
        </h1>
        <p className="rise max-w-[640px] text-[18px] leading-[28px] text-[#2A3547] md:text-[21px] md:leading-[32px]" style={{ '--i': 1 }}>
          Scan a label or paste a note. MedLens explains each word, plans your day and checks <em className="text-primary">FDA warnings</em>.
        </p>
        <div className="rise flex w-full flex-col gap-3 pt-1.5 sm:w-auto sm:flex-row" style={{ '--i': 2 }}>
          <a href="#/app/today" className="inline-flex h-[58px] items-center justify-center rounded-[10px] bg-primary px-7 text-[18px] font-semibold leading-[22px] text-white transition hover:-translate-y-0.5 hover:bg-[#143d8f]">Open MedLens</a>
          <button type="button" onClick={() => tryExample(CARDIAC.id)}
            className="inline-flex h-[58px] items-center justify-center rounded-[10px] border-[1.5px] border-control bg-surface px-6 text-[18px] font-semibold leading-[22px] text-black transition hover:-translate-y-0.5 hover:border-ink-2">Try an example</button>
        </div>
        <p className="text-[15px] leading-[18px] text-ink-2">Free · No sign-up · Data from openFDA</p>
      </div>

      <div className="rise mx-auto flex max-w-[1120px] flex-col rounded-t-[14px] border border-b-0 border-line bg-surface text-left"
        style={{ '--i': 3, boxShadow: '0 -8px 40px #1849A91A' }}>
        <div className="flex h-10 shrink-0 items-center gap-2 border-b border-[#EDF0F4] px-4" aria-hidden="true">
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <span key={c} className="size-2.5 shrink-0 rounded-full" style={{ background: c, ...DOT_SHADOW }} />)}
          <span className="flex flex-1 justify-center pr-[54px]">
            <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-md bg-canvas px-3 py-[3px] text-[13px] leading-4 text-ink-2">
              <Lock className="size-3 shrink-0" />medlens.app/translate
            </span>
          </span>
        </div>
        <div className="flex flex-col md:flex-row">
          <div className="flex flex-1 flex-col gap-4 border-b border-[#EDF0F4] px-6 py-7 md:border-b-0 md:border-r md:px-8">
            <p className="text-[15px] leading-[18px] text-ink-2">What the label says</p>
            <div className="font-mono text-[16px] leading-[30px] text-black md:text-[20px] md:leading-[36px]">
              {segs.map((line, n) => (
                <p key={n} className="whitespace-pre-wrap">{line.map((s, k) => s.term && isCode(s.term) ? (
                  <button key={k} type="button" onClick={() => { setAuto(false); setTerm(s.term); }} aria-pressed={term?.term === s.term.term}
                    className={`rounded-[4px] px-[2px] text-primary underline decoration-1 underline-offset-[5px] transition-colors ${term?.term === s.term.term ? 'bg-primary-soft' : 'hover:bg-primary-soft'}`}>
                    {s.text}
                  </button>
                ) : <span key={k}>{s.text}</span>)}</p>
              ))}
            </div>
            <div className="flex w-fit items-center gap-3 rounded-[10px] bg-[#F1F9F4] px-3.5 py-3">
              <span className="text-[14px] leading-[18px] text-ink-2">Reading level</span>
              <span className="text-[15px] leading-[18px] text-black"><span className="text-danger">Grade {GRADE_BEFORE}</span> → <span className="font-semibold text-safe">Grade {grade}</span></span>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-3.5 px-6 py-7 md:px-8">
            <p className="text-[15px] leading-[18px] text-ink-2">What it means</p>
            {term && (
              <div key={term.term} className="pop flex flex-col gap-1 rounded-[10px] bg-primary-soft p-4" aria-live="polite">
                <span className="font-mono text-[14px] leading-[18px] text-primary">{term.term}</span>
                <span className="text-[22px] font-semibold leading-[28px] text-black">{term.plain.en}</span>
              </div>
            )}
            <ul className="flex flex-col gap-0.5 px-4 py-1">
              {CARDIAC.meds.map((m) => (
                <li key={m.id} className="text-[17px] font-semibold leading-[26px] text-black">{m.name} <span className="font-normal text-[#2A3547]">· {m.slots.map((s) => SLOT_WORDS[s]).join(' and ')}</span></li>
              ))}
              <li className="pt-1 text-[16px] leading-[22px] text-[#2A3547]">Edema means <em className="text-primary">swelling</em>, often in the legs.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* Sections 2–10 are ported value-for-value from Paper "MedLens" › Homepage · Desktop (2MH-0, ≥768px)
   and Homepage · Mobile (3A0-0, <768px). 1152px content column = max-w-[1200px] + px-6. */
const WRAP = 'mx-auto w-full max-w-[1200px] px-4 md:px-6';
const H2 = 'font-semibold text-black text-[30px] tracking-[-0.02em] md:text-[48px] md:leading-[54px] md:tracking-[-0.025em]';
const INK_GRAD = { backgroundImage: 'linear-gradient(160deg, #2B3442 0%, #161C26 100%)' };
/** Mobile copy / desktop copy (the boards word some lines differently). */
const R = ({ m, d }) => <><span className="md:hidden">{m}</span><span className="hidden md:inline">{d}</span></>;

/* 2. The problem */
const STATS = [
  ['12%', 'of US adults have proficient health literacy.', 'NCES, 2003', 'NCES, National Assessment of Adult Literacy, 2003'],
  ['72%', 'of discharged patients could not list all their medicines.', 'Mayo Clinic Proceedings, 2005', 'Makaryus & Friedman, Mayo Clinic Proceedings, 2005'],
  ['1.5M+', 'ER visits each year for adverse drug events.', 'CDC', 'CDC, Medication Safety Program'],
];
function StatNum({ n, run }) {
  const [, num, suffix] = n.match(/^([\d.]+)(.*)$/);
  return <>{useCount(parseFloat(num), run, { decimals: num.includes('.') ? 1 : 0 })}{suffix}</>;
}
export function Problem() {
  const [ref, on] = useReveal();
  return (
    <section ref={ref} className={`bg-ink py-14 text-white md:py-[112px] ${on ? 'in' : ''}`} aria-labelledby="problem-h">
      <div className={WRAP}>
        <h2 id="problem-h" className="rv max-w-[760px] text-[30px] font-semibold leading-[36px] tracking-[-0.02em] md:text-[48px] md:leading-[56px] md:tracking-[-0.025em]">
          Medicine labels are written for doctors. <em className="text-[#7FB0FF]">Patients pay the price.</em>
        </h2>
        <dl className="mt-7 grid gap-7 md:mt-14 md:grid-cols-3 md:gap-12">
          {STATS.map(([n, text, srcM, srcD], i) => (
            <div key={n} style={{ '--i': i + 1 }} className="rv flex flex-col gap-1.5 border-t border-[#2B3A52] pt-[18px] md:gap-3 md:pt-6">
              <dt className="text-[48px] font-semibold leading-[52px] md:text-[72px] md:leading-[76px] md:tracking-[-0.03em]"><StatNum n={n} run={on} /></dt>
              <dd className="text-[17px] leading-[25px] text-[#DCE4F0] md:text-[19px] md:leading-[28px]">{text}</dd>
              <dd className="text-[13px] leading-4 text-[#8C9AB2]"><R m={srcM} d={srcD} /></dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* 3. How it works */
const STEP_TITLE = 'text-[22px] font-semibold leading-[28px] text-black';
const STEP_TEXT = 'text-[17px] leading-[26px] text-ink-2';
const STEP_CARD = 'h-[220px] shrink-0 rounded-[12px] transition-[translate] duration-[160ms] group-hover:-translate-y-0.5 md:h-[280px]';
export function How() {
  const [ref, on] = useReveal();
  return (
    <section id="how" ref={ref} className={`scroll-mt-24 bg-white py-12 md:py-[112px] ${on ? 'in' : ''}`} aria-labelledby="how-h">
      <div className={WRAP}>
        <h2 id="how-h" className={`rv ${H2} max-w-[640px] leading-[34px]`}>Scan. Understand. Remember.</h2>
        <div className="mt-6 grid items-start gap-6 md:mt-12 md:grid-cols-[1.2fr_1fr_1fr] md:gap-8">
          <article style={{ '--i': 1 }} className="rv group flex flex-col gap-2.5 md:gap-5">
            <div className={`${STEP_CARD} relative flex items-center justify-center`} style={INK_GRAD} aria-hidden="true">
              <div className="flex h-[220px] w-[180px] items-center justify-center rounded-[12px] border-[3px] border-white">
                <div className="flex h-[90px] w-[140px] flex-col gap-[7px] rounded-[6px] bg-[#FFFFFFEB] p-3">
                  <div className="h-[7px] w-[60%] rounded-[3px] bg-primary" />
                  <div className="h-[5px] w-[90%] rounded-[3px] bg-[#9AA4B2]" />
                  <div className="h-[5px] w-[75%] rounded-[3px] bg-[#9AA4B2]" />
                </div>
              </div>
              <div className="absolute inset-x-5 bottom-[18px] h-1.5 rounded-[3px] bg-[#FFFFFF33]">
                <div style={{ '--d': '240ms' }} className="fill-in h-1.5 w-[64%] rounded-[3px] bg-white" />
              </div>
            </div>
            <h3 className={STEP_TITLE}>Scan</h3>
            <p className={STEP_TEXT}>Point your camera at the label.</p>
          </article>
          <article style={{ '--i': 2 }} className="rv group flex flex-col gap-2.5 md:gap-5">
            <div className={`${STEP_CARD} flex flex-col justify-center gap-3.5 bg-[#EAF1FC] p-7`} aria-hidden="true">
              <p className="font-mono text-[18px] font-medium leading-[22px] text-ink-2">
                Metformin 500 mg PO <span className="font-semibold text-primary underline decoration-1">BID</span>
              </p>
              <div className="flex flex-col gap-1 rounded-[10px] border border-line bg-white p-4" style={{ boxShadow: '0 12px 24px #0F1B2D1A' }}>
                <p className="text-[20px] font-semibold leading-6 text-primary">Twice a day</p>
                <p className="text-[16px] leading-5 text-ink-2">With breakfast and dinner</p>
              </div>
            </div>
            <h3 className={STEP_TITLE}>Understand</h3>
            <p className={STEP_TEXT}>Tap any blue word.</p>
          </article>
          <article style={{ '--i': 3 }} className="rv group flex flex-col gap-2.5 md:gap-5">
            <div className={`${STEP_CARD} flex flex-col justify-center gap-2.5 bg-[#F1F9F4] p-7`} aria-hidden="true">
              {[['8:00 AM', '3 pills', true], ['6:00 PM', '1 pill', false], ['9:00 PM', '1 pill', false]].map(([t, n, done]) => (
                <div key={t} className="flex items-center justify-between rounded-[8px] border border-line bg-white px-3.5 py-3">
                  <span className="text-[16px] font-semibold leading-5 text-black">{t}</span>
                  <span className="text-[15px] leading-[18px] text-ink-2">{n}</span>
                  <span className={`size-6 shrink-0 rounded-[6px] ${done ? 'bg-safe' : 'border-2 border-[#9AA4B2]'}`} />
                </div>
              ))}
            </div>
            <h3 className={STEP_TITLE}>Remember</h3>
            <p className={STEP_TEXT}>A daily plan, a fridge card, reminders.</p>
          </article>
        </div>
      </div>
    </section>
  );
}

/* 4. Feature bento */
const SLOTS = [['morning', 'Morning', 'AM'], ['noon', 'Noon', 'Noon'], ['evening', 'Evening', 'PM'], ['bedtime', 'Bedtime', 'Bed']]
  .map(([k, label, short]) => [label, short, CARDIAC.meds.filter((m) => m.slots.includes(k)).map((m) => `${m.name} ${parseInt(m.dose, 10)}`)]);
const LIFT = 'transition-[translate,border-color,box-shadow] duration-[160ms] ease-[cubic-bezier(0.2,0,0,1)] hover:-translate-y-0.5 hover:border-control hover:shadow-[0_8px_24px_#0F1B2D14]';
const TILE = `flex flex-col justify-between rounded-[14px] ${LIFT}`;
const TILE_W = `${TILE} border border-line bg-white`;
const T22 = 'text-[22px] font-semibold leading-[28px] text-black';
const T20 = 'text-[20px] font-semibold leading-6 text-black';
const CHIP = 'rounded-[6px] px-2 py-1 text-[14px] font-semibold leading-[18px]';
const M_TILE = 'flex flex-1 basis-0 flex-col gap-2 rounded-[14px] p-4';
const M_T16 = 'text-[16px] font-semibold leading-5 text-black';
function FeaturesDesktop() {
  return (
    <div className="hidden flex-col gap-5 md:flex">
      <div style={{ '--i': 1 }} className="rv grid gap-5 md:grid-cols-2 lg:flex lg:h-[300px]">
        <article className={`${TILE} min-h-[240px] p-7 text-white md:col-span-2 lg:flex-[2_1_0%]`} style={INK_GRAD}>
          <div className="flex flex-col gap-1.5">
            <h3 className="text-[24px] font-semibold leading-[30px]">Scan with camera</h3>
            <p className="text-[17px] leading-[22px] text-[#C9D2E0]">Point. Capture. Done.</p>
          </div>
          <div className="flex items-center gap-3.5" aria-hidden="true">
            <div className="h-2 flex-1 rounded-[4px] bg-[#FFFFFF2E]"><div style={{ '--d': '240ms' }} className="fill-in h-2 w-[72%] rounded-[4px] bg-white" /></div>
            <span className="text-[15px] font-semibold leading-[18px]">Reading label 72%</span>
          </div>
        </article>
        <article className={`${TILE_W} min-h-[240px] lg:flex-1 p-7`}>
          <h3 className={T22}>Plain-language translator</h3>
          <div className="flex flex-col gap-1.5" aria-hidden="true">
            <p className="font-mono text-[16px] leading-5 text-ink-2">q8h</p>
            <p className="text-[20px] font-semibold leading-6 text-primary">Every 8 hours</p>
          </div>
        </article>
        <article className={`${TILE} min-h-[240px] lg:flex-1 border border-[#CFE7DA] bg-[#F1F9F4] p-7`}>
          <h3 className={T22}>Reading-level meter</h3>
          <p className="text-[40px] font-semibold leading-[48px] tracking-[-0.02em] text-black">
            <span className="text-danger">{GRADE_BEFORE}</span> → <span className="text-safe">{GRADE_AFTER}</span>
          </p>
        </article>
      </div>
      <div style={{ '--i': 2 }} className="rv grid gap-5 md:grid-cols-2 lg:flex lg:h-[300px]">
        <article className={`${TILE_W} min-h-[240px] justify-start gap-[18px] p-7 md:col-span-2 lg:flex-[2_1_0%]`}>
          <h3 className="text-[24px] font-semibold leading-[30px] text-black">Daily pill timeline</h3>
          <div className="flex flex-1 gap-3" aria-hidden="true">
            {SLOTS.map(([label, , meds]) => (
              <div key={label} className="flex flex-1 basis-0 flex-col gap-2 rounded-[10px] bg-canvas p-3.5">
                <p className="text-[15px] font-semibold leading-[18px] text-black">{label}</p>
                {meds.length ? meds.map((m) => <p key={m} className="text-[14px] leading-[18px] text-black">{m}</p>)
                  : <p className="text-[14px] leading-[18px] text-ink-2">Free</p>}
              </div>
            ))}
          </div>
        </article>
        <article className={`${TILE} min-h-[240px] lg:flex-1 border border-[#F0D3B0] bg-caution-soft p-7`}>
          <h3 className={T22}>Interaction check</h3>
          <div className="flex flex-col gap-2">
            <span className="self-start rounded-[6px] bg-caution px-2 py-[3px] text-[13px] font-semibold leading-4 text-white">Moderate</span>
            <p className="text-[17px] font-semibold leading-[22px] text-black">Furosemide + Lisinopril</p>
            <p className="text-[15px] leading-[18px] text-[#6E3203]">Dizziness, low blood pressure</p>
          </div>
        </article>
        <article className={`${TILE} min-h-[240px] lg:flex-1 bg-primary-soft p-7`}>
          <h3 className={T22}>Read aloud</h3>
          <div className="eq flex h-12 shrink-0 items-end gap-[5px]" aria-hidden="true">
            {[20, 40, 28, 48, 24, 36, 16].map((h, i) => <span key={i} className="w-2 shrink-0 rounded-[3px] bg-primary" style={{ height: h, '--i': i }} />)}
          </div>
        </article>
      </div>
      <div style={{ '--i': 3 }} className="rv grid gap-5 md:grid-cols-2 lg:h-[220px] lg:grid-cols-4">
        <article className={`${TILE_W} min-h-[200px] p-6`}>
          <h3 className={T20}>4 languages</h3>
          <div className="flex gap-1.5" aria-hidden="true">
            {['EN', 'ES', 'FR', '中文'].map((l, i) => <span key={l} className={`${CHIP} ${i ? 'border border-control text-black' : 'bg-ink text-white'}`}>{l}</span>)}
          </div>
        </article>
        <article className={`${TILE_W} min-h-[200px] p-6`}>
          <h3 className={T20}>Fridge card + QR</h3>
          <div className="flex items-center gap-3">
            <QRCodeSVG value="https://github.com/Duckafaligy/evohacks-2-medlens" size={56} level="L" marginSize={0} fgColor="#0F1B2D" aria-hidden="true" />
            <p className="text-[15px] leading-[18px] text-ink-2">Print. Stick. Scan.</p>
          </div>
        </article>
        <article className={`${TILE_W} min-h-[200px] p-6`}>
          <h3 className={T20}>Calendar reminders</h3>
          <div className="flex flex-col gap-1 text-[13px] font-semibold leading-4" aria-hidden="true">
            <p className="h-[22px] rounded-[5px] border-l-[3px] border-primary bg-primary-soft pl-2 text-primary">8:00 Furosemide</p>
            <p className="h-[22px] rounded-[5px] border-l-[3px] border-safe bg-safe-soft pl-2 text-safe">21:00 Atorvastatin</p>
          </div>
        </article>
        <article className={`${TILE_W} min-h-[200px] p-6`}>
          <h3 className={T20}>Teach-back quiz</h3>
          <div className="flex flex-col gap-1.5" aria-hidden="true">
            <p className="text-[15px] leading-[18px] text-black">When do you take Lisinopril?</p>
            <div className="flex gap-1.5">
              <span className={`${CHIP} bg-safe px-2.5 text-white`}>Morning</span>
              <span className={`${CHIP} border border-control px-2.5 font-normal text-black`}>Bedtime</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
function FeaturesMobile() {
  return (
    <div className="rv flex flex-col gap-3 md:hidden" style={{ '--i': 1 }}>
      <article className="flex flex-col gap-3.5 rounded-[14px] p-5" style={INK_GRAD}>
        <h3 className="text-[20px] font-semibold leading-6 text-white">Scan with camera</h3>
        <div className="h-1.5 rounded-[3px] bg-[#FFFFFF2E]" aria-hidden="true"><div style={{ '--d': '240ms' }} className="fill-in h-1.5 w-[72%] rounded-[3px] bg-white" /></div>
      </article>
      <div className="flex gap-3">
        <article className={`${M_TILE} gap-2.5 border border-line bg-white`}>
          <h3 className={M_T16}>Translator</h3>
          <p className="text-[16px] font-semibold leading-5 text-primary">q8h = every 8 hours</p>
        </article>
        <article className={`${M_TILE} gap-2.5 border border-[#CFE7DA] bg-[#F1F9F4]`}>
          <h3 className={M_T16}>Reading level</h3>
          <p className="text-[24px] font-semibold leading-[30px] text-black"><span className="text-danger">{GRADE_BEFORE}</span> → <span className="text-safe">{GRADE_AFTER}</span></p>
        </article>
      </div>
      <article className="flex flex-col gap-2 rounded-[14px] border border-line bg-white p-4">
        <h3 className={M_T16}>Daily pill timeline</h3>
        <div className="flex gap-1.5">
          {SLOTS.map(([label, short, meds]) => (
            <p key={label} className="flex-1 basis-0 rounded-[8px] bg-canvas p-2 text-[13px] font-semibold leading-4 text-black">{short} · {meds.length}</p>
          ))}
        </div>
      </article>
      <div className="flex gap-3">
        <article className={`${M_TILE} border border-[#F0D3B0] bg-caution-soft`}>
          <h3 className={M_T16}>Interaction check</h3>
          <span className="self-start rounded-[6px] bg-caution px-2 py-0.5 text-[12px] font-semibold leading-4 text-white">Moderate</span>
        </article>
        <article className={`${M_TILE} bg-primary-soft`}>
          <h3 className={M_T16}>Read aloud</h3>
          <div className="eq flex h-6 shrink-0 items-end gap-1" aria-hidden="true">
            {[10, 22, 14, 24].map((h, i) => <span key={i} className="w-1.5 shrink-0 rounded-[2px] bg-primary" style={{ height: h, '--i': i }} />)}
          </div>
        </article>
      </div>
      {[['4 languages', 'Fridge card + QR'], ['Calendar reminders', 'Teach-back quiz']].map((pair) => (
        <div key={pair[0]} className="flex gap-3">
          {pair.map((t) => <h3 key={t} className="flex-1 basis-0 rounded-[14px] border border-line bg-white p-3.5 text-[15px] font-semibold leading-[18px] text-black">{t}</h3>)}
        </div>
      ))}
    </div>
  );
}
export function Features() {
  const [ref, on] = useReveal();
  const [eqRef, playing] = useReveal(false); // read-aloud bars only move while on screen
  return (
    <section id="features" ref={ref} className={`scroll-mt-24 bg-canvas py-14 md:py-[112px] ${on ? 'in' : ''}`} aria-labelledby="features-h">
      <div className={WRAP}>
        <div ref={eqRef} className={playing ? 'playing' : ''}>
        <h2 id="features-h" className={`rv ${H2} mb-6 leading-[34px] md:mb-12`}>Everything on one screen.</h2>
        <FeaturesMobile />
        <FeaturesDesktop />
        </div>
      </div>
    </section>
  );
}

/* 5. Warnings from the label */
export function Warning() {
  const [ref, on] = useReveal();
  return (
    <section ref={ref} className={`bg-white py-14 md:py-[112px] ${on ? 'in' : ''}`} aria-labelledby="warn-h">
      <div className={`${WRAP} flex flex-col gap-5 md:flex-row md:items-center md:gap-10 lg:gap-20`}>
        <div className="flex flex-col gap-5 md:w-[440px] md:shrink">
          <h2 id="warn-h" className={`rv ${H2} leading-[35px]`}>Warnings, <em className="text-danger">straight from the label.</em></h2>
          <p className="rv hidden text-[19px] leading-[29px] text-[#2A3547] md:block" style={{ '--i': 1 }}>Every alert links to the FDA drug label it came from.</p>
        </div>
        <article className="rv-r flex flex-1 flex-col gap-3.5 rounded-[14px] border border-l-[5px] border-line border-l-danger bg-white p-5 md:gap-[18px] md:border-l-[6px] md:p-8 shadow-[0_12px_32px_#0F1B2D1A] md:shadow-[0_20px_48px_#0F1B2D1A]">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[20px] font-semibold leading-6 text-black md:text-[28px] md:leading-[34px]">Warfarin + Aspirin</h3>
            <span className="rounded-[6px] bg-danger px-2.5 py-[3px] text-[13px] font-semibold leading-4 text-white md:px-3 md:py-[5px] md:text-[15px] md:leading-[18px]">High</span>
          </div>
          <div className="hidden gap-1 md:flex" aria-hidden="true">
            {[0, 1, 2].map((i) => <span key={i} className="fill-in h-2 flex-1 rounded-[3px] bg-danger" style={{ '--d': `${280 + i * 80}ms` }} />)}
          </div>
          <p className="text-[17px] leading-[25px] text-black md:text-[20px] md:leading-[30px]">
            <R m={<>Higher risk of <em className="text-danger">serious bleeding</em>. Call your doctor first.</>}
              d={<>Taking both raises your risk of <em className="text-danger">serious bleeding</em>. Call your doctor before taking aspirin.</>} />
          </p>
          <blockquote className="flex flex-col gap-2 rounded-[10px] bg-canvas p-3.5 md:px-5 md:py-[18px]">
            <p className="font-mono text-[13px] leading-5 text-[#2A3547] md:text-[15px] md:leading-6">
              <R m={'"Warfarin sodium can cause major or fatal bleeding."'} d={'"WARNING: BLEEDING RISK. Warfarin sodium can cause major or fatal bleeding."'} />
            </p>
            <span className="self-start rounded-[6px] border border-[#BFE0E7] bg-white px-2 py-0.5 text-[13px] font-semibold leading-4 text-info md:px-2.5 md:py-[3px] md:text-[14px] md:leading-[18px]">
              <R m="Source: FDA label" d="Source: FDA label · Boxed warning" />
            </span>
          </blockquote>
        </article>
      </div>
    </section>
  );
}

/* 6. Who it's for — photos self-hosted from the Paper file (public/home). */
const PEOPLE = [
  ['Seniors', 'Big text. One tap to hear it.', '/home/seniors.jpg', '50% 40%', 'An older adult pouring pills from a prescription bottle into their hand'],
  ['Caregivers', 'Share the plan with family.', '/home/caregivers.jpg', '50% 50%', 'A weekly pill organiser being filled'],
  ['Parents', 'mL to teaspoons, done right.', '/home/parents.jpg', '50% 70%', 'Medicine for a family'],
];
export function Who() {
  const [ref, on] = useReveal();
  return (
    <section id="who" ref={ref} className={`scroll-mt-24 bg-canvas py-14 md:py-[112px] ${on ? 'in' : ''}`} aria-labelledby="who-h">
      <div className={WRAP}>
        <h2 id="who-h" className={`rv ${H2} mb-6 leading-[35px] md:mb-10`}>Made for the people <em className="text-primary">holding the bottle.</em></h2>
        <div className="grid grid-cols-2 gap-3 md:h-[420px] md:grid-cols-[1.3fr_1fr_1fr_1fr] md:gap-5 lg:grid-cols-[1.3fr_1fr_1fr_auto]">
          {PEOPLE.map(([t, s, src, pos, alt], i) => (
            <article key={t} style={{ '--i': i + 1 }} className={`rv flex min-w-0 flex-col overflow-hidden rounded-[14px] border border-line bg-white ${LIFT} ${i ? '' : 'col-span-2 md:col-span-1'}`}>
              <img src={src} alt={alt} loading="lazy" style={{ objectPosition: pos }}
                className={`w-full shrink-0 object-cover md:h-auto md:min-h-0 md:flex-1 ${i ? 'h-[120px]' : 'h-[200px]'}`} />
              <div className={`flex flex-col md:gap-1 md:px-[22px] md:py-5 ${i ? 'px-3.5 py-3' : 'gap-0.5 px-4 py-3.5'}`}>
                <h3 className={`font-semibold text-black md:text-[22px] md:leading-[28px] ${i ? 'text-[16px] leading-5' : 'text-[19px] leading-6'}`}>{t}</h3>
                <p className={`text-[15px] leading-[18px] text-[#2A3547] md:block md:text-[16px] md:leading-5 ${i ? 'hidden' : ''}`}>{s}</p>
              </div>
            </article>
          ))}
          <article style={{ '--i': 4 }} className="rv col-span-2 flex items-center justify-between rounded-[14px] bg-ink px-4 py-[18px] text-white transition-[translate] duration-[160ms] hover:-translate-y-0.5 md:col-span-1 md:flex-col md:items-stretch md:p-[22px]">
            <p className="hidden whitespace-pre-line text-[30px] font-semibold leading-9 md:block" lang="mul">{'Hola.\nBonjour.\n'}<span lang="zh">你好.</span></p>
            <div className="flex flex-col gap-1">
              <h3 className="text-[19px] font-semibold leading-6 md:text-[22px] md:leading-[28px]">Newcomers</h3>
              <p className="hidden text-[16px] leading-5 text-[#C9D2E0] md:block lg:whitespace-nowrap">Your label, in your language.</p>
            </div>
            <p className="text-[17px] font-semibold leading-[22px] text-[#C9D2E0] md:hidden" lang="mul">Hola · Bonjour · <span lang="zh">你好</span></p>
          </article>
        </div>
      </div>
    </section>
  );
}

/* 7. Senior Mode before/after */
export function Senior() {
  const [ref, on] = useReveal();
  return (
    <section ref={ref} className={`bg-white py-12 md:py-[112px] ${on ? 'in' : ''}`} aria-labelledby="senior-h">
      <div className={`${WRAP} flex flex-col gap-[18px] md:flex-row md:items-center md:gap-10 lg:gap-[72px]`}>
        <div className="flex flex-col gap-5 md:w-[380px] md:shrink">
          <h2 id="senior-h" className={`rv ${H2} leading-[34px]`}>Bigger when you need it.</h2>
          <p className="hidden text-[19px] leading-[29px] text-ink-2 md:block">Senior Mode: larger text, stronger contrast, bigger buttons.</p>
        </div>
        <div style={{ '--i': 1 }} className="rv relative flex min-w-0 flex-1 overflow-hidden rounded-[14px] border border-line md:h-[360px]">
          <div className="flex flex-1 basis-0 flex-col justify-center gap-1.5 bg-white p-4 md:gap-2.5 md:p-9">
            <p className="text-[13px] leading-4 text-ink-2 md:text-[14px] md:leading-[18px]">Standard</p>
            <p className="text-[15px] font-semibold leading-[18px] text-black md:text-[20px] md:leading-6">Lisinopril 10 mg</p>
            <p className="text-[13px] leading-4 text-ink-2 md:text-[16px] md:leading-5">1 pill · morning</p>
            <span className="hidden h-11 items-center self-start rounded-[8px] bg-primary px-4 text-[15px] font-semibold leading-[18px] text-white md:flex" aria-hidden="true">I took it</span>
          </div>
          <div className="flex grow-[1.3] basis-0 flex-col justify-center gap-1.5 border-l-[3px] border-ink bg-white p-4 md:grow md:gap-3.5 md:p-9">
            <p className="text-[14px] font-semibold leading-[18px] text-black md:text-[16px] md:leading-5">Senior Mode</p>
            <p className="text-[21px] font-semibold leading-[26px] text-black md:text-[32px] md:leading-[38px]">Lisinopril 10 mg</p>
            <p className="text-[17px] leading-[22px] text-black md:text-[24px] md:leading-[30px]">1 pill · morning</p>
            <span className="hidden h-16 items-center self-start rounded-[10px] bg-ink px-[26px] text-[22px] font-semibold leading-[28px] text-white md:flex" aria-hidden="true">I took it</span>
          </div>
          <span className="absolute left-[calc(50%-20px)] top-[calc(50%-20px)] hidden size-10 items-center justify-center rounded-[10px] bg-ink md:flex" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M9 18l-6-6 6-6M15 6l6 6-6 6" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
        </div>
      </div>
    </section>
  );
}

/* 8. Privacy */
const PRIVACY = [['Account', 'Not needed'], ['Sent to the FDA', 'Medicine names only'], ['Tracking', 'None']];
export function Privacy() {
  const [ref, on] = useReveal();
  return (
    <section id="privacy" ref={ref} className={`scroll-mt-24 py-12 text-white md:py-[112px] ${on ? 'in' : ''}`} aria-labelledby="privacy-h"
      style={{ backgroundImage: 'linear-gradient(160deg, #16243A 0%, #0F1B2D 100%)' }}>
      <div className={`${WRAP} flex flex-col gap-[18px] md:flex-row md:items-start md:gap-10 lg:gap-20`}>
        <div className="flex flex-1 flex-col gap-[18px] md:gap-5">
          <svg className="size-8 md:size-10" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="4" y="11" width="16" height="10" rx="2" fill="none" stroke="#7FB0FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" fill="none" stroke="#7FB0FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h2 id="privacy-h" className="rv text-[30px] font-semibold leading-[35px] tracking-[-0.02em] md:text-[48px] md:leading-[54px] md:tracking-[-0.025em]">Your health info stays on your device.</h2>
        </div>
        <dl className="flex flex-col md:w-[460px] md:shrink md:pt-16">
          {PRIVACY.map(([k, v], i) => (
            <div key={k} style={{ '--i': i + 1 }} className="rv flex justify-between gap-4 border-b border-[#2B3A52] py-3.5 text-[16px] leading-5 last:border-b-0 md:py-[18px] md:text-[18px] md:leading-[22px]">
              <dt>{k}</dt><dd className="font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* 9. FAQ (single open) */
const FAQS = [
  [<R key="q" m="Is this medical advice?" d="Is this medical advice?" />,
    <R key="a" m={<>No. It explains your label. <em className="text-primary">Always check with your pharmacist or doctor.</em></>}
      d={<>No. MedLens explains what your label says. <em className="text-primary">Always check with your pharmacist or doctor.</em></>} />],
  [<R key="q" m="Where does the data come from?" d="Where does the drug data come from?" />,
    'Warnings, side effects and interaction text come from official FDA drug labels through the openFDA API. A saved copy of those labels is used if you are offline.'],
  ['Is my information stored?', 'Your medicine list is kept in your browser on this device. If you choose to create an account, your list is synced to it so only you can see it. Label photos are read on your device and never uploaded.'],
  ['Does it work offline?', 'Mostly. Your plan, fridge card and saved label copies work without internet. Live FDA lookups and the first photo scan need a connection.'],
  [<R key="q" m="Which languages?" d="Which languages are supported?" />, 'English, Spanish, French and Simplified Chinese — for the instructions, the buttons and read-aloud.'],
];
export function Faq() {
  const [ref, on] = useReveal();
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" ref={ref} className={`scroll-mt-24 bg-white py-14 md:py-[112px] ${on ? 'in' : ''}`} aria-labelledby="faq-h">
      <div className={`${WRAP} flex flex-col md:flex-row md:gap-10 lg:gap-20`}>
        <h2 id="faq-h" className={`rv ${H2} pb-4 leading-[34px] md:w-[360px] md:shrink-0 md:pb-0 lg:w-[360px]`}>Questions, answered.</h2>
        <div className="flex flex-1 flex-col">
          {FAQS.map(([q, a], i) => (
            <div key={i} style={{ '--i': i + 1 }} className="rv border-b border-line py-[18px] md:py-6">
              <h3>
                <button type="button" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} aria-controls={`faq-${i}`}
                  className="flex w-full items-center justify-between gap-4 text-left text-[18px] font-semibold leading-[22px] text-black md:text-[21px] md:leading-[26px]">
                  {q}
                  <svg className="size-5 shrink-0 md:size-[22px]" viewBox="0 0 24 24" aria-hidden="true">
                    <path d={open === i ? 'M5 12h14' : 'M12 5v14M5 12h14'} fill="none" stroke={open === i ? '#1849A9' : '#46536A'} strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </button>
              </h3>
              <div id={`faq-${i}`} inert={open !== i} aria-hidden={open !== i}
                className={`grid transition-[grid-template-rows] duration-[240ms] ease-[cubic-bezier(0.2,0,0,1)] ${open === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                  <p className="max-w-[620px] pt-2.5 text-[16px] leading-6 text-[#2A3547] md:pt-3 md:text-[18px] md:leading-[28px]">{a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* 10. Closing CTA */
export function Cta() {
  const { tryExample } = useApp();
  const [ref, on] = useReveal();
  return (
    <section ref={ref} className={`py-14 text-white md:py-[120px] ${on ? 'in' : ''}`} aria-labelledby="cta-h" style={{ backgroundImage: 'linear-gradient(135deg, #1849A9 0%, #123A8A 100%)' }}>
      <div className={`${WRAP} flex flex-col gap-5 md:items-center md:gap-7`}>
        <h2 id="cta-h" className="rv max-w-[900px] text-[34px] font-semibold leading-[39px] tracking-[-0.02em] md:text-center md:text-[60px] md:leading-[66px] md:tracking-[-0.03em]">Make sense of your next prescription.</h2>
        <div style={{ '--i': 1 }} className="rv flex flex-col gap-5 md:flex-row md:gap-3">
          <a href="#/app/today" className="flex h-14 items-center justify-center rounded-[10px] bg-white px-7 text-[18px] font-semibold leading-[22px] text-primary transition-[translate,background-color] duration-[160ms] ease-[cubic-bezier(0.2,0,0,1)] hover:-translate-y-px hover:bg-[#E8EFFB] md:h-[58px]">Open MedLens</a>
          <button type="button" onClick={() => tryExample(CARDIAC.id)} className="flex h-14 items-center justify-center rounded-[10px] border-[1.5px] border-[#FFFFFF8C] px-6 text-[18px] font-semibold leading-[22px] transition-[translate,background-color] duration-[160ms] ease-[cubic-bezier(0.2,0,0,1)] hover:-translate-y-px hover:bg-white/10 md:h-[58px]">Try an example</button>
        </div>
        <p style={{ '--i': 2 }} className="rv hidden text-[15px] leading-[18px] text-[#C9D8F5] md:block">Free · No sign-up · Data from openFDA</p>
      </div>
    </section>
  );
}
