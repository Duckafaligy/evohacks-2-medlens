// Homepage sections (English copy). Composed in src/views/Home.jsx.
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Camera, Check, ChevronDown, Lock, Volume2, AlertTriangle, CalendarDays, Languages, Printer, CircleHelp, Gauge, ListChecks,
} from 'lucide-react';
import { useApp } from '../components/ctx.js';
import { highlightTerms } from '../lib/parse.js';
import { fkGrade } from '../lib/readability.js';
import { SCENARIOS } from '../data/scenarios.js';
import { PHOTOS } from '../data/links.js';

const CARDIAC = SCENARIOS[0];
const GRADE_BEFORE = Math.round(fkGrade(CARDIAC.raw));
const GRADE_AFTER = Math.max(1, Math.round(fkGrade(CARDIAC.meds.map((m) => m.plain.en).join(' '))));
const SLOT_WORDS = { morning: 'each morning', noon: 'at noon', evening: 'each evening', bedtime: 'at bedtime' };

const Section = ({ id, className = '', children, label }) => (
  <section id={id} aria-label={label} className={`scroll-mt-24 px-4 py-20 md:px-6 md:py-28 ${className}`}>
    <div className="mx-auto max-w-6xl">{children}</div>
  </section>
);

const PrimaryCta = () => {
  const { tryExample } = useApp();
  return (
    <div className="flex flex-wrap justify-center gap-3">
      <a href="#/app/today" className="btn inline-flex items-center rounded-md bg-primary px-6 font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-primary/90">Open MedLens</a>
      <button type="button" onClick={() => tryExample(CARDIAC.id)} className="btn rounded-md border border-control bg-surface px-6 font-semibold text-ink transition-transform hover:-translate-y-0.5">Try an example</button>
    </div>
  );
};

/* 1. Hero with a working mini translator */
export function Hero() {
  const lines = CARDIAC.raw.split('\n').filter((l) => /mg/.test(l));
  const segs = lines.map((l) => highlightTerms(l));
  const [term, setTerm] = useState(() => segs.flat().find((s) => s.term?.term === 'BID')?.term);
  return (
    <section className="grad-calm px-4 pb-16 pt-32 md:px-6 md:pt-40" aria-labelledby="hero-h">
      <div className="mx-auto max-w-6xl text-center">
        <h1 id="hero-h" className="rise text-h1 leading-[1.05] tracking-tight md:text-display">
          Understand every prescription.
          <em className="block text-primary">In plain words, in seconds.</em>
        </h1>
        <p className="rise mx-auto mt-6 max-w-xl text-lead text-ink-2" style={{ '--i': 1 }}>
          Scan a label or paste a note. MedLens explains each word, plans your day and checks <span className="text-primary underline decoration-primary/40 underline-offset-4">FDA warnings</span>.
        </p>
        <div className="rise mt-8" style={{ '--i': 2 }}><PrimaryCta /></div>
        <p className="mt-4 text-small text-ink-2">Free · No sign-up · Data from openFDA</p>

        <div className="rise mx-auto mt-12 max-w-5xl overflow-hidden rounded-lg border border-line bg-surface text-left shadow-2xl shadow-primary/10" style={{ '--i': 3 }}>
          <div className="flex items-center gap-2 border-b border-line bg-canvas px-4 py-2.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-control" /><span className="size-2.5 rounded-full bg-control" /><span className="size-2.5 rounded-full bg-control" />
            <span className="mx-auto rounded-sm bg-surface px-3 py-0.5 text-[12px] text-ink-2">medlens.app/translate</span>
          </div>
          <div className="grid md:grid-cols-2">
            <div className="border-b border-line p-6 md:border-b-0 md:border-r">
              <p className="text-small text-ink-2">What the label says</p>
              <div className="mt-3 space-y-2 font-mono text-[15px]">
                {segs.map((line, n) => (
                  <p key={n}>{line.map((s, k) => s.term ? (
                    <button key={k} type="button" onClick={() => setTerm(s.term)} aria-pressed={term?.term === s.term.term}
                      className={`rounded-sm px-0.5 text-primary underline decoration-primary/50 underline-offset-4 transition-colors ${term?.term === s.term.term ? 'bg-primary text-white' : 'hover:bg-primary-soft'}`}>
                      {s.text}
                    </button>
                  ) : <span key={k}>{s.text}</span>)}</p>
                ))}
              </div>
              <p className="mt-5 inline-flex items-center gap-2 rounded-sm bg-safe-soft px-2.5 py-1 text-small text-safe">
                Reading level <span className="font-semibold text-caution">Grade {GRADE_BEFORE}</span> → <span className="font-semibold">Grade {GRADE_AFTER}</span>
              </p>
            </div>
            <div className="p-6">
              <p className="text-small text-ink-2">What it means</p>
              {term && (
                <div key={term.term} className="pop mt-3 rounded-md bg-primary-soft p-4" aria-live="polite">
                  <p className="font-mono text-small text-primary">{term.term}</p>
                  <p className="text-lead font-semibold">{term.plain.en}</p>
                </div>
              )}
              <ul className="mt-4 space-y-2">
                {CARDIAC.meds.map((m) => (
                  <li key={m.id}><span className="font-semibold">{m.name} {m.dose}</span> <span className="text-ink-2">· {m.slots.map((s) => SLOT_WORDS[s]).join(' and ')}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 2. The problem */
const STATS = [
  ['12%', 'of U.S. adults have proficient health literacy.', 'U.S. Dept. of Education, National Assessment of Adult Literacy, 2003'],
  ['72%', 'of patients leaving the hospital could not list all their medicines.', 'Makaryus & Friedman, Mayo Clinic Proceedings, 2005'],
  ['1.5M+', 'emergency visits each year in the U.S. for adverse drug events.', 'CDC, Medication Safety Program'],
];
export function Problem() {
  return (
    <section className="grad-ink px-4 py-20 text-white md:px-6 md:py-24" aria-labelledby="problem-h">
      <div className="mx-auto max-w-6xl">
        <h2 id="problem-h" className="max-w-2xl text-h2 leading-tight md:text-h1">Medicine labels are written for doctors. <em className="text-[#8FB2F0]">Patients pay the price.</em></h2>
        <dl className="mt-12 grid gap-10 md:grid-cols-3">
          {STATS.map(([n, text, src]) => (
            <div key={n}>
              <dt className="text-display leading-none">{n}</dt>
              <dd className="mt-3 text-lead opacity-90">{text}</dd>
              <dd className="mt-2 text-[13px] opacity-60">{src}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* 3. How it works */
export function How() {
  return (
    <Section id="how" label="How it works">
      <h2 className="text-h2 md:text-h1">Scan. Understand. Remember.</h2>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <article className="group">
          <div className="grad-ink grid h-56 place-items-center rounded-lg p-6 transition-transform group-hover:-translate-y-1" aria-hidden="true">
            <div className="relative grid h-40 w-28 place-items-center rounded-md border-2 border-white/80">
              <div className="w-20 space-y-1.5 rounded-sm bg-white/90 p-2"><div className="h-1.5 w-12 rounded-sm bg-primary" /><div className="h-1 rounded-sm bg-ink-2/50" /><div className="h-1 w-10 rounded-sm bg-ink-2/50" /></div>
              <div className="absolute -bottom-6 h-1 w-40 overflow-hidden rounded-sm bg-white/20"><div className="bar-fill h-full w-3/4 bg-white" /></div>
            </div>
          </div>
          <h3 className="mt-4 text-h3">Scan</h3><p className="text-ink-2">Point your camera at the label.</p>
        </article>
        <article className="group">
          <div className="grid h-56 place-items-center rounded-lg bg-primary-soft p-6 transition-transform group-hover:-translate-y-1" aria-hidden="true">
            <div className="w-full max-w-xs">
              <p className="font-mono text-[14px]">Metformin 500 mg PO <span className="text-primary underline underline-offset-4">BID</span></p>
              <div className="mt-3 rounded-md border border-line bg-surface p-3 shadow-sm"><p className="font-semibold text-primary">Twice a day</p><p className="text-small text-ink-2">With breakfast and dinner</p></div>
            </div>
          </div>
          <h3 className="mt-4 text-h3">Understand</h3><p className="text-ink-2">Tap any blue word.</p>
        </article>
        <article className="group">
          <div className="grad-mint grid h-56 place-items-center rounded-lg p-6 transition-transform group-hover:-translate-y-1" aria-hidden="true">
            <div className="w-full max-w-xs space-y-2">
              {[['8:00 AM', '3 pills', true], ['6:00 PM', '1 pill', false], ['9:00 PM', '1 pill', false]].map(([t, n, d]) => (
                <div key={t} className="flex items-center gap-3 rounded-md bg-surface px-3 py-2 text-small">
                  <span className="font-semibold">{t}</span><span className="flex-1 text-ink-2">{n}</span>
                  <span className={`grid size-5 place-items-center rounded-sm ${d ? 'bg-safe text-white' : 'border border-control'}`}>{d && <Check className="size-3.5" />}</span>
                </div>
              ))}
            </div>
          </div>
          <h3 className="mt-4 text-h3">Remember</h3><p className="text-ink-2">A daily plan, a fridge card, reminders.</p>
        </article>
      </div>
    </Section>
  );
}

/* 4. Feature bento */
const Tile = ({ className = '', title, sub, Icon, children }) => (
  <article className={`flex min-h-48 flex-col rounded-lg border border-line p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${className}`}>
    <div className="flex items-start justify-between gap-2">
      <div><h3 className="font-semibold">{title}</h3>{sub && <p className="text-small opacity-75">{sub}</p>}</div>
      {Icon && <Icon className="size-5 shrink-0 opacity-60" aria-hidden="true" />}
    </div>
    <div className="mt-auto pt-4" aria-hidden="true">{children}</div>
  </article>
);
export function Features() {
  return (
    <Section id="features" label="Features" className="bg-surface">
      <h2 className="text-h2 md:text-h1">Everything on one screen.</h2>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile className="grad-ink border-transparent text-white sm:col-span-2" title="Scan with camera" sub="Point. Capture. Done." Icon={Camera}>
          <div className="flex items-center gap-3 text-small"><div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-white/20"><div className="bar-fill h-full w-[72%] bg-white" /></div>Reading label 72%</div>
        </Tile>
        <Tile className="bg-surface" title="Plain-language translator" Icon={Languages}>
          <p className="font-mono text-small text-ink-2">q8h</p><p className="text-lead font-semibold text-primary">Every 8 hours</p>
        </Tile>
        <Tile className="grad-mint" title="Reading-level meter" Icon={Gauge}>
          <p className="text-h2 font-semibold"><span className="text-danger">{GRADE_BEFORE}</span> → <span className="text-safe">{GRADE_AFTER}</span></p>
        </Tile>
        <Tile className="bg-surface sm:col-span-2" title="Daily pill timeline" Icon={ListChecks}>
          <div className="grid grid-cols-4 gap-2 text-[12px]">
            {[['Morning', 'Furosemide 40\nLisinopril 10\nMetformin 500'], ['Noon', 'Free'], ['Evening', 'Metformin 500'], ['Bedtime', 'Atorvastatin 20']].map(([s, m]) => (
              <div key={s} className="rounded-md bg-canvas p-2"><p className="font-semibold">{s}</p><p className="whitespace-pre-line text-ink-2">{m}</p></div>
            ))}
          </div>
        </Tile>
        <Tile className="grad-warn" title="Interaction check" Icon={AlertTriangle}>
          <span className="rounded-sm bg-caution px-1.5 py-0.5 text-[12px] font-semibold text-white">Moderate</span>
          <p className="mt-2 font-semibold">Furosemide + Lisinopril</p><p className="text-small text-ink-2">Dizziness, low blood pressure</p>
        </Tile>
        <Tile className="bg-primary-soft" title="Read aloud" Icon={Volume2}>
          <div className="flex h-10 items-end gap-1">{[40, 70, 100, 60, 85, 45, 75].map((h, i) => <span key={i} className="w-2 rounded-sm bg-primary" style={{ height: `${h}%` }} />)}</div>
        </Tile>
        <Tile className="bg-surface" title="4 languages">
          <div className="flex gap-1.5">{['EN', 'ES', 'FR', '中文'].map((l, i) => <span key={l} className={`rounded-sm px-2 py-1 text-small font-semibold ${i ? 'bg-canvas' : 'bg-ink text-white'}`}>{l}</span>)}</div>
        </Tile>
        <Tile className="bg-surface" title="Fridge card + QR" Icon={Printer}>
          <div className="flex items-center gap-3"><QRCodeSVG value="https://github.com/Duckafaligy/evohacks-2-medlens" size={48} level="L" marginSize={0} /><p className="text-small text-ink-2">Print. Stick. Scan.</p></div>
        </Tile>
        <Tile className="bg-surface" title="Calendar reminders" Icon={CalendarDays}>
          <div className="space-y-1 text-[12px]"><p className="rounded-sm border-l-[3px] border-primary bg-primary-soft px-2 py-1">8:00 Furosemide</p><p className="rounded-sm border-l-[3px] border-ink-2 bg-canvas px-2 py-1">21:00 Atorvastatin</p></div>
        </Tile>
        <Tile className="bg-surface" title="Teach-back quiz" Icon={CircleHelp}>
          <p className="text-small text-ink-2">When do you take Lisinopril?</p>
          <div className="mt-2 flex gap-1.5 text-[12px]"><span className="rounded-sm bg-safe px-2 py-1 font-semibold text-white">Morning</span><span className="rounded-sm bg-canvas px-2 py-1">Bedtime</span></div>
        </Tile>
      </div>
    </Section>
  );
}

/* 5. Warnings from the label */
export function Warning() {
  return (
    <Section label="Safety warnings">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-h2 leading-tight md:text-h1">Warnings, <em className="text-danger">straight from the label.</em></h2>
          <p className="mt-4 max-w-md text-lead text-ink-2">Every alert links back to the FDA drug label it came from.</p>
        </div>
        <article className="rounded-lg border border-line border-l-4 border-l-danger bg-surface p-6 shadow-xl transition-transform hover:-translate-y-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-h3">Warfarin + Aspirin</h3>
            <span className="rounded-sm bg-danger px-2 py-0.5 text-small font-semibold text-white">High</span>
          </div>
          <p className="mt-3 text-lead">Aspirin plus warfarin raises the risk of <span className="text-danger">bleeding</span>. Only take both if your doctor told you to.</p>
          <blockquote className="mt-4 rounded-md bg-canvas p-4 font-mono text-small text-ink-2">“WARNING: BLEEDING RISK. Warfarin sodium can cause major or fatal bleeding.”</blockquote>
          <p className="mt-3 inline-block rounded-sm bg-info-soft px-2 py-0.5 text-[12px] font-semibold text-info">Source: FDA label · Boxed warning</p>
        </article>
      </div>
    </Section>
  );
}

/* 6. Who it's for */
const PEOPLE = [
  ['Seniors', 'Big text. One tap to hear it.', PHOTOS.seniors, 'Medicine in an older adult’s hands'],
  ['Caregivers', 'Share the plan with family.', PHOTOS.caregivers, 'Medicines organised by a caregiver'],
  ['Parents', 'mL and teaspoons, done right.', PHOTOS.parents, 'Medicine for a family'],
];
export function Who() {
  return (
    <Section id="who" label="Who it's for" className="bg-surface">
      <h2 className="text-h2 md:text-h1">Made for the people <em className="text-primary">holding the bottle.</em></h2>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PEOPLE.map(([t, s, src, alt]) => (
          <article key={t} className="overflow-hidden rounded-lg border border-line bg-surface transition-all hover:-translate-y-1 hover:shadow-lg">
            <img src={src} alt={alt} width="600" height="600" loading="lazy" className="aspect-square w-full object-cover" />
            <div className="p-4"><h3 className="font-semibold">{t}</h3><p className="text-small text-ink-2">{s}</p></div>
          </article>
        ))}
        <article className="grad-ink flex min-h-80 flex-col justify-between rounded-lg p-6 text-white transition-transform hover:-translate-y-1">
          <p className="text-h2 leading-tight" lang="mul">Hola.<br />Bonjour.<br /><span lang="zh">你好。</span></p>
          <div><h3 className="font-semibold">Newcomers</h3><p className="text-small opacity-80">Your label, in your language.</p></div>
        </article>
      </div>
    </Section>
  );
}

/* 7. Senior Mode before/after */
function PillCard({ big }) {
  return (
    <div className={`rounded-md border border-line bg-surface ${big ? 'p-6' : 'p-4'}`}>
      <p className={big ? 'text-small font-semibold' : 'text-[12px] text-ink-2'}>{big ? 'Senior Mode' : 'Standard'}</p>
      <p className={`font-semibold ${big ? 'text-h2' : 'text-body'}`}>Lisinopril 10 mg</p>
      <p className={big ? 'text-lead' : 'text-small text-ink-2'}>1 pill · morning</p>
      <span className={`mt-3 inline-flex items-center rounded-md font-semibold text-white ${big ? 'h-14 bg-ink px-6 text-lead' : 'h-8 bg-primary px-3 text-small'}`}>I took it</span>
    </div>
  );
}
export function Senior() {
  const [pos, setPos] = useState(50);
  return (
    <Section label="Senior Mode">
      <div className="grid items-center gap-10 md:grid-cols-[1fr_1.2fr]">
        <div>
          <h2 className="text-h2 leading-tight md:text-h1">Bigger when you need it.</h2>
          <p className="mt-4 text-lead text-ink-2">Senior Mode: larger text, stronger contrast, bigger buttons.</p>
        </div>
        <div className="relative overflow-hidden rounded-lg border border-line bg-canvas">
          <div className="grid h-80 place-items-center p-6"><div className="w-full max-w-xs"><PillCard /></div></div>
          <div className="absolute inset-0 grid place-items-center bg-surface p-6" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}><div className="w-full max-w-sm"><PillCard big /></div></div>
          <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-ink" style={{ left: `${pos}%` }} aria-hidden="true">
            <span className="absolute top-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-ink bg-surface text-[12px] font-semibold">⇆</span>
          </div>
          <input type="range" min="5" max="95" value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label="Compare standard and Senior Mode"
            className="absolute inset-0 size-full cursor-ew-resize opacity-0" />
        </div>
      </div>
    </Section>
  );
}

/* 8. Privacy */
const PRIVACY = [['Account', 'Optional'], ['Photos', 'Read on your device'], ['Sent to the FDA', 'Medicine names only'], ['Tracking', 'None']];
export function Privacy() {
  return (
    <section id="privacy" className="grad-ink scroll-mt-24 px-4 py-20 text-white md:px-6" aria-labelledby="privacy-h">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2">
        <div>
          <Lock className="size-8 text-[#8FB2F0]" aria-hidden="true" />
          <h2 id="privacy-h" className="mt-4 text-h2 leading-tight">Your health info stays on your device.</h2>
        </div>
        <dl className="divide-y divide-white/15 self-center">
          {PRIVACY.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-4"><dt className="opacity-75">{k}</dt><dd className="font-semibold">{v}</dd></div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* 9. FAQ (single open) */
const FAQS = [
  ['Is this medical advice?', 'No. MedLens explains what your label says in plain words. Always check with your pharmacist or doctor before changing how you take a medicine.'],
  ['Where does the drug data come from?', 'Warnings, side effects and interaction text come from official FDA drug labels through the openFDA API. A saved copy of those labels is used if you are offline.'],
  ['Is my information stored?', 'Your medicine list is kept in your browser on this device. If you choose to create an account, your list is synced to it so only you can see it. Label photos are read on your device and never uploaded.'],
  ['Does it work offline?', 'Mostly. Your plan, fridge card and saved label copies work without internet. Live FDA lookups and the first photo scan need a connection.'],
  ['Which languages are supported?', 'English, Spanish, French and Simplified Chinese — for the instructions, the buttons and read-aloud.'],
];
export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <Section id="faq" label="FAQ">
      <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
        <h2 className="text-h2 leading-tight md:text-h1">Questions, answered.</h2>
        <div className="divide-y divide-line border-y border-line">
          {FAQS.map(([q, a], i) => (
            <div key={q}>
              <h3>
                <button type="button" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} aria-controls={`faq-${i}`}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left text-lead font-semibold">
                  {q}<ChevronDown className={`size-5 shrink-0 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
              </h3>
              <div id={`faq-${i}`} hidden={open !== i} className="pop pb-5 text-ink-2">{a}</div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* 10. Closing CTA */
export function Cta() {
  const { tryExample } = useApp();
  return (
    <section className="bg-primary px-4 py-20 text-center text-white md:px-6" aria-labelledby="cta-h">
      <h2 id="cta-h" className="mx-auto max-w-2xl text-h2 leading-tight md:text-h1">Make sense of your next prescription.</h2>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a href="#/app/today" className="btn inline-flex items-center rounded-md bg-white px-6 font-semibold text-primary transition-transform hover:-translate-y-0.5">Open MedLens</a>
        <button type="button" onClick={() => tryExample(CARDIAC.id)} className="btn rounded-md border border-white/60 px-6 font-semibold transition-transform hover:-translate-y-0.5">Try an example</button>
      </div>
      <p className="mt-4 text-small opacity-80">Free · No sign-up · Data from openFDA</p>
    </section>
  );
}
