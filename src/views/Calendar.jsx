// Today calendar — Day / Week / Month in the approved "Today · Week" Paper style.
import { useEffect, useRef, useState } from 'react';
import { CalendarPlus, Check, ChevronLeft, ChevronRight, Download, Printer, X } from 'lucide-react';
import { useApp, useCabinet, useNow } from '../components/ctx.js';
import { downloadIcs, googleCalendarUrl } from '../lib/ics.js';
import * as cabinet from '../lib/cabinet.js';
import { SLOTS, localDay, activeOn, slotMinutes, slotTime, colorFor, nextDose } from '../lib/app.js';

const START = 7;
const ROWS = 16;
const H = 44;
const LINE = '#E5E9EF';
const SLOT_COLOR = { morning: '#1849A9', noon: '#0E6A80', evening: '#12704F', bedtime: '#4A5A72' };
const MODES = ['day', 'week', 'month'];
const top = (min) => ((min - START * 60) / 60) * H;
const tz = () => new Date().toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop();
const toDate = (day) => new Date(`${day}T12:00`);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const mondayOf = (d) => addDays(d, -((d.getDay() + 6) % 7));
const hourLabel = (slot, locale) => new Date(2000, 0, 1, Math.floor(slotMinutes(slot) / 60), slotMinutes(slot) % 60)
  .toLocaleTimeString(locale, { hour: 'numeric', minute: slotMinutes(slot) % 60 ? '2-digit' : undefined });
const clock = (iso, locale) => new Date(iso).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });

const readMode = () => {
  try {
    const m = localStorage.getItem('medlens.calMode');
    if (MODES.includes(m)) return m;
  } catch { /* private mode */ }
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches ? 'day' : 'week';
};

/** Status of one dose time on one day. */
function slotState(meds, slot, day, today, nowMin) {
  const taken = cabinet.takenOn(day);
  const done = meds.filter((m) => taken.some((t) => t.id === m.id && t.slot === slot)).length;
  const past = day < today || (day === today && slotMinutes(slot) + 60 < nowMin);
  return { taken, done, all: done === meds.length, missed: past && done === 0, future: day > today };
}
const dueFor = (items, slot, day) => items.filter((m) => m.slots?.includes(slot) && activeOn(m, day));

const CheckCircle = ({ color = '#FFFFFF' }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" className="shrink-0" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="2.6" />
    <path d="M8 12l3 3 5-6" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ---------- popover ---------- */
function DosePopover({ pop, items, today, onClose }) {
  const { tr, lang } = useApp();
  const ref = useRef(null);
  const locale = lang === 'zh' ? 'zh-CN' : lang;
  useEffect(() => {
    const el = ref.current;
    el?.querySelector('button')?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && el) { // keep focus inside
        const f = [...el.querySelectorAll('button:not([disabled])')];
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
        else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
      }
    };
    const onDown = (e) => { if (el && !el.contains(e.target)) onClose(); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onDown);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('mousedown', onDown); pop.from?.focus?.(); };
  }, [onClose, pop.from]);
  const meds = dueFor(items, pop.slot, pop.day);
  const { taken, all } = slotState(meds, pop.slot, pop.day, today, 0);
  const future = pop.day > today;
  const W = 320;
  const left = Math.min(Math.max(8, pop.rect.right + 8 + W > window.innerWidth ? pop.rect.left - W - 8 : pop.rect.right + 8), window.innerWidth - W - 8);
  const topPx = Math.min(Math.max(8, pop.rect.top), window.innerHeight - 340);
  const food = (m) => ({ with: tr('withFood'), before: tr('beforeFood'), without: tr('emptyStomach') })[m.withFood];
  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-label={`${tr(pop.slot)} ${slotTime(pop.slot)}`}
      className="pop fixed z-50 flex w-[320px] flex-col gap-3 rounded-lg border border-line bg-surface p-4 shadow-[0_12px_32px_#0F1B2D29]"
      style={{ left, top: topPx }}>
      <div className="flex items-start gap-3">
        <span className="mt-1 size-3.5 shrink-0 rounded-[4px]" style={{ background: SLOT_COLOR[pop.slot] }} aria-hidden="true" />
        <div className="flex-1">
          <p className="text-[18px] font-semibold leading-6">{tr(pop.slot)} · {slotTime(pop.slot)}</p>
          <p className="text-[13px] leading-4 text-ink-2">{toDate(pop.day).toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })}{future ? ` · ${tr('upcoming')}` : ''}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-[8px] hover:bg-canvas"><X className="size-4" /></button>
      </div>
      <ul className="flex flex-col">
        {meds.map((m) => {
          const t = taken.find((x) => x.id === m.id && x.slot === pop.slot);
          return (
            <li key={m.id} className="flex items-center gap-3 border-t py-2.5" style={{ borderColor: '#EBEFF4' }}>
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: colorFor(items, m.id) }} aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold leading-5">{m.name} <span className="font-normal text-ink-2">{m.strength}</span></span>
                <span className="block text-[13px] leading-4 text-ink-2">{[food(m), t?.at && `${tr('taken')} ${clock(t.at, locale)}`].filter(Boolean).join(' · ') || ' '}</span>
              </span>
              <button type="button" disabled={future} onClick={() => cabinet.markTaken(m.id, pop.day, pop.slot, !t)}
                aria-pressed={!!t} aria-label={tr('markTaken', { name: `${m.name} ${m.strength}` })}
                className={`grid size-8 shrink-0 place-items-center rounded-full border-2 transition-colors duration-150 disabled:opacity-40 ${t ? 'border-safe bg-safe text-white' : 'border-control bg-surface hover:border-primary'}`}>
                {t && <Check className="size-4" strokeWidth={3} aria-hidden="true" />}
              </button>
            </li>
          );
        })}
      </ul>
      <button type="button" disabled={future || all} onClick={() => meds.forEach((m) => cabinet.markTaken(m.id, pop.day, pop.slot, true))}
        className="flex h-10 items-center justify-center gap-2 rounded-md bg-primary text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-primary/90 disabled:bg-canvas disabled:text-ink-2">
        <Check className="size-4" aria-hidden="true" />{future ? tr('upcoming') : all ? tr('allTaken') : tr('markAll')}
      </button>
    </div>
  );
}

/* ---------- blocks ---------- */
function Block({ slot, meds, day, today, nowMin, wide, onOpen, tr, locale }) {
  const { taken, done, all, missed, future } = slotState(meds, slot, day, today, nowMin);
  const rowsH = wide ? 24 + meds.length * 26 : 0;
  const height = Math.max((meds.length >= 3 ? 1.5 : 1) * H - 1, rowsH);
  const names = meds.map((m) => m.name.split(' ')[0]).join(', ');
  const label = `${tr(slot)} ${slotTime(slot)}: ${meds.map((m) => m.name).join(', ')}. ${missed ? tr('missed') : all ? tr('allTaken') : tr('nOfM', { n: done, m: meds.length })}`;
  const fg = missed ? '#0F1B2D' : '#FFFFFF';
  return (
    <div role="button" tabIndex={0} aria-label={label} aria-haspopup="dialog"
      onClick={(e) => onOpen(slot, day, e.currentTarget)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(slot, day, e.currentTarget); } }}
      className="absolute inset-x-1 z-10 flex cursor-pointer flex-col gap-0.5 overflow-hidden rounded-sm px-[7px] py-[5px] text-left transition-[filter,box-shadow] duration-200 hover:shadow-[0_4px_12px_#0F1B2D2E] hover:brightness-95"
      style={{ top: top(slotMinutes(slot)) + 1, height, background: missed ? '#FFFFFF' : SLOT_COLOR[slot], border: missed ? '1.5px solid #B4232A' : 'none' }}>
      <span className="flex items-center justify-between gap-1">
        <span className="truncate text-[12px] font-semibold leading-[15px]" style={{ color: missed ? '#B4232A' : '#FFFFFF' }}>
          {missed ? `${tr('missed')} · ${hourLabel(slot, locale)}` : slotTime(slot)}
        </span>
        {!missed && (all ? <CheckCircle /> : done > 0 && <span className="shrink-0 text-[11px] font-semibold text-white">{tr('nOfM', { n: done, m: meds.length })}</span>)}
      </span>
      {wide ? (
        <span className="flex flex-col">
          {meds.map((m) => {
            const t = taken.some((x) => x.id === m.id && x.slot === slot);
            return (
              <span key={m.id} className="flex h-[26px] items-center justify-between gap-2">
                <span className="truncate text-[13px] leading-4" style={{ color: fg }}>{m.name} <span className="opacity-80">{m.strength}</span></span>
                <button type="button" disabled={future} aria-pressed={t} aria-label={tr('markTaken', { name: m.name })}
                  onClick={(e) => { e.stopPropagation(); cabinet.markTaken(m.id, day, slot, !t); }}
                  className="grid size-[22px] shrink-0 place-items-center rounded-full border-2 transition-colors duration-150 disabled:opacity-40"
                  style={{ borderColor: missed ? '#C5CEDA' : 'rgba(255,255,255,.75)', background: t ? (missed ? '#12704F' : '#FFFFFF') : 'transparent' }}>
                  {t && <Check className="size-3" strokeWidth={3.5} style={{ color: missed ? '#FFFFFF' : SLOT_COLOR[slot] }} aria-hidden="true" />}
                </button>
              </span>
            );
          })}
        </span>
      ) : (
        <span className="text-[11px] leading-[13px]" style={{ color: fg }}>{names}</span>
      )}
    </div>
  );
}

function TimeGrid({ days, items, today, nowMin, onOpen, tr, locale }) {
  const wide = days.length === 1;
  return (
    <div className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-line bg-surface">
      <div className={wide ? '' : 'min-w-[720px]'}>
        <div className="flex border-b" style={{ borderColor: LINE }}>
          <div className="flex w-14 shrink-0 items-end justify-end pb-2 pr-2 text-[10px] leading-3 text-ink-2">{tz()}</div>
          {days.map((d) => {
            const isToday = localDay(d) === today;
            return (
              <div key={d.toISOString()} className={`flex flex-1 items-center gap-0.5 py-2.5 ${wide ? 'flex-row justify-start gap-3 pl-4' : 'flex-col'}`}>
                <span className={`text-[11px] font-semibold uppercase leading-[14px] tracking-[0.06em] ${isToday ? 'text-primary' : 'text-ink-2'}`}>{d.toLocaleDateString(locale, { weekday: 'short' })}</span>
                <span className={`grid size-11 place-items-center rounded-full text-[26px] leading-8 ${isToday ? 'bg-primary text-white' : 'text-ink'}`}>{d.getDate()}</span>
              </div>
            );
          })}
        </div>
        <div className="relative flex" style={{ height: (ROWS - 1) * H + 12 }}>
          <div className="relative w-14 shrink-0" aria-hidden="true">
            {Array.from({ length: ROWS }, (_, i) => (
              <span key={i} className="absolute right-2 text-[11px] leading-[14px] text-ink-2" style={{ top: i * H + (i ? -7 : 4) }}>
                {new Date(2000, 0, 1, START + i).toLocaleTimeString(locale, { hour: 'numeric' })}
              </span>
            ))}
          </div>
          {Array.from({ length: ROWS - 1 }, (_, i) => (
            <div key={i} className="pointer-events-none absolute right-0 h-px" style={{ left: 56, top: (i + 1) * H, background: LINE }} aria-hidden="true" />
          ))}
          {days.map((d) => {
            const day = localDay(d);
            return (
              <div key={day} role="group" aria-label={d.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })}
                className="relative flex-1 border-l" style={{ borderColor: LINE }}>
                {SLOTS.map((slot) => {
                  const meds = dueFor(items, slot, day);
                  return meds.length ? <Block key={slot} {...{ slot, meds, day, today, nowMin, wide, onOpen, tr, locale }} /> : null;
                })}
                {day === today && nowMin >= START * 60 && nowMin <= (START + ROWS) * 60 && (
                  <div className="pointer-events-none absolute -left-1.5 right-0 z-20 flex h-2.5 items-center" style={{ top: top(nowMin) - 5 }} aria-label={tr('now')}>
                    <span className="size-2.5 shrink-0 rounded-full bg-danger" />
                    <span className="h-0.5 flex-1 bg-danger" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MonthGrid({ sel, items, today, nowMin, onPick, locale }) {
  const first = new Date(sel.getFullYear(), sel.getMonth(), 1);
  const start = addDays(first, -first.getDay());
  const weeks = Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)))
    .filter((w) => w.some((d) => d.getMonth() === first.getMonth()));
  const heads = Array.from({ length: 7 }, (_, i) => addDays(new Date(2023, 0, 1), i).toLocaleDateString(locale, { weekday: 'short' }));
  return (
    <div className="min-w-0 flex-1 overflow-hidden rounded-lg border border-line bg-surface">
      <div className="grid grid-cols-7 border-b" style={{ borderColor: LINE }}>
        {heads.map((h) => <div key={h} className="py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-2">{h}</div>)}
      </div>
      {weeks.map((w, i) => (
        <div key={i} className="grid grid-cols-7">
          {w.map((d, k) => {
            const day = localDay(d);
            const out = d.getMonth() !== first.getMonth();
            return (
              <button key={day} type="button" onClick={() => onPick(day)}
                aria-label={d.toLocaleDateString(locale, { dateStyle: 'full' })}
                className={`flex min-h-[104px] flex-col items-start gap-1 border-b p-1.5 text-left transition-colors duration-150 hover:bg-canvas ${k ? 'border-l' : ''}`}
                style={{ borderColor: LINE }}>
                <span className={`grid size-7 place-items-center rounded-full text-[13px] ${day === today ? 'bg-primary font-semibold text-white' : out ? 'text-[#9AA6B8]' : 'text-ink'}`}>{d.getDate()}</span>
                {SLOTS.map((slot) => {
                  const meds = dueFor(items, slot, day);
                  if (!meds.length) return null;
                  const { all, missed } = slotState(meds, slot, day, today, nowMin);
                  return (
                    <span key={slot} className="flex w-full items-center gap-1 truncate rounded-[4px] px-1.5 py-px text-[11px] font-semibold leading-4"
                      style={{ background: missed ? '#FFFFFF' : SLOT_COLOR[slot], color: missed ? '#B4232A' : '#FFFFFF', border: missed ? '1px solid #B4232A' : '1px solid transparent' }}>
                      {all && <Check className="size-3 shrink-0" strokeWidth={3} aria-hidden="true" />}
                      {hourLabel(slot, locale)} · {meds.length}
                    </span>
                  );
                })}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function MiniMonth({ sel, setSel, items, today, nowMin, locale, tr }) {
  const [shift, setShift] = useState(0);
  const first = new Date(sel.getFullYear(), sel.getMonth() + shift, 1);
  const start = addDays(first, -first.getDay());
  const weeks = Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)))
    .filter((w) => w.some((d) => d.getMonth() === first.getMonth()));
  const heads = Array.from({ length: 7 }, (_, i) => addDays(new Date(2023, 0, 1), i).toLocaleDateString(locale, { weekday: 'narrow' }));
  const selDay = localDay(sel);
  const dot = (day) => {
    if (day > today) return null;
    const due = SLOTS.flatMap((s) => dueFor(items, s, day).map((m) => [m, s])).filter(([, s]) => day < today || slotMinutes(s) <= nowMin);
    if (!due.length) return null;
    const tk = cabinet.takenOn(day);
    const n = due.filter(([m, s]) => tk.some((t) => t.id === m.id && t.slot === s)).length;
    return n === due.length ? '#12704F' : '#A14A06';
  };
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between px-1 pb-1">
        <p className="text-[14px] font-semibold leading-[18px]">{first.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</p>
        <span className="flex gap-1 text-ink-2">
          <button type="button" onClick={() => setShift(shift - 1)} aria-label={tr('prevMonth')} className="grid size-7 place-items-center rounded-full hover:bg-surface"><ChevronLeft className="size-3.5" strokeWidth={2.4} /></button>
          <button type="button" onClick={() => setShift(shift + 1)} aria-label={tr('nextMonth')} className="grid size-7 place-items-center rounded-full hover:bg-surface"><ChevronRight className="size-3.5" strokeWidth={2.4} /></button>
        </span>
      </div>
      <div className="flex">{heads.map((h, i) => <span key={i} className="flex-1 text-center text-[11px] font-semibold leading-[14px] text-ink-2" aria-hidden="true">{h}</span>)}</div>
      {weeks.map((w, i) => (
        <div key={i} className="flex">
          {w.map((d) => {
            const day = localDay(d);
            const isToday = day === today;
            const isSel = day === selDay && !isToday;
            const out = d.getMonth() !== first.getMonth();
            const c = dot(day);
            return (
              <button key={day} type="button" onClick={() => { setSel(d); setShift(0); }} aria-pressed={day === selDay}
                aria-label={d.toLocaleDateString(locale, { dateStyle: 'full' })}
                className="flex h-9 flex-1 flex-col items-center justify-center">
                <span className={`grid size-[26px] place-items-center rounded-full text-[12px] leading-4 transition-colors duration-150 ${isToday ? 'bg-primary font-semibold text-white' : isSel ? 'bg-primary-soft font-semibold text-primary' : out ? 'text-[#9AA6B8] hover:bg-surface' : 'text-ink hover:bg-surface'}`}>
                  {d.getDate()}
                </span>
                <span className="size-1 rounded-full" style={{ background: c || 'transparent' }} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default function Calendar() {
  const { tr, lang, openFridge } = useApp();
  const { items } = useCabinet();
  const now = useNow(30000);
  const [mode, setModeState] = useState(readMode);
  const [sel, setSel] = useState(() => new Date());
  const [pop, setPop] = useState(null);
  const locale = lang === 'zh' ? 'zh-CN' : lang;
  const today = localDay(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const scheduled = items.filter((m) => m.slots?.length);
  const usedSlots = SLOTS.filter((s) => scheduled.some((m) => m.slots.includes(s)));
  const setMode = (m) => { setModeState(m); try { localStorage.setItem('medlens.calMode', m); } catch { /* ignore */ } };
  const step = (dir) => {
    const d = new Date(sel);
    if (mode === 'day') d.setDate(d.getDate() + dir);
    if (mode === 'week') d.setDate(d.getDate() + dir * 7);
    if (mode === 'month') { d.setDate(1); d.setMonth(d.getMonth() + dir); }
    setSel(d);
  };
  const days = mode === 'day' ? [sel] : Array.from({ length: 7 }, (_, i) => addDays(mondayOf(sel), i));
  const title = mode === 'day'
    ? sel.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })
    : sel.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  const next = nextDose(scheduled, cabinet.takenOn(today), now);
  const onOpen = (slot, day, el) => setPop({ slot, day, rect: el.getBoundingClientRect(), from: el });
  const BTN = 'flex h-9 items-center gap-1.5 rounded-[8px] border border-line bg-surface px-3 text-[14px] font-semibold leading-[18px] text-ink transition-colors duration-150 hover:bg-canvas';

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setSel(new Date())} className={`${BTN} px-4`}>{tr('today')}</button>
        <div className="flex gap-0.5">
          <button type="button" onClick={() => step(-1)} aria-label={tr('previous')} className="grid size-9 place-items-center rounded-[8px] text-ink-2 hover:bg-surface"><ChevronLeft className="size-[18px]" /></button>
          <button type="button" onClick={() => step(1)} aria-label={tr('next')} className="grid size-9 place-items-center rounded-[8px] text-ink-2 hover:bg-surface"><ChevronRight className="size-[18px]" /></button>
        </div>
        <h1 className="min-w-0 flex-1 text-[22px] font-normal leading-7">{title}</h1>
        <div role="radiogroup" aria-label={tr('navCalendar')} className="flex h-9 gap-0.5 rounded-[8px] p-0.5" style={{ background: '#E9EDF2' }}>
          {MODES.map((m) => (
            <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)}
              className={`flex h-8 items-center rounded-sm border px-3.5 text-[14px] leading-[18px] transition-colors duration-150 ${mode === m ? 'border-line bg-surface font-semibold text-ink' : 'border-transparent text-ink-2 hover:text-ink'}`}>
              {tr(`mode_${m}`)}
            </button>
          ))}
        </div>
        <button type="button" onClick={openFridge} className={BTN}><Printer className="size-[15px]" aria-hidden="true" />{tr('fridgeShort')}</button>
        <button type="button" disabled={!scheduled.length} onClick={() => downloadIcs(scheduled, { lang })} className={`${BTN} disabled:opacity-50`}>
          <Download className="size-[15px]" aria-hidden="true" />{tr('downloadIcs')}
        </button>
        <details className="relative">
          <summary className={`${BTN} cursor-pointer list-none`}><CalendarPlus className="size-[15px]" aria-hidden="true" />{tr('googleCalendar')}</summary>
          <div className="pop absolute right-0 z-30 mt-2 w-80 space-y-1 rounded-md border border-line bg-surface p-2 shadow-xl">
            {scheduled.flatMap((m) => m.slots.map((s) => (
              <a key={m.id + s} href={googleCalendarUrl(m, s, new Date(), { lang })} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-sm px-2 py-2 text-[14px] hover:bg-canvas">
                <span className="size-2.5 rounded-full" style={{ background: colorFor(items, m.id) }} aria-hidden="true" />
                <span className="flex-1 font-semibold">{m.name} {m.strength}</span>
                <span className="text-ink-2">{slotTime(s)}</span>
              </a>
            )))}
          </div>
        </details>
      </header>

      <div className="flex flex-col gap-5 lg:flex-row">
        <aside className="flex w-full shrink-0 flex-col gap-6 lg:w-[216px]">
          {next ? (
            <div className="rounded-lg bg-primary p-4 text-white" aria-live="polite">
              <p className="text-[13px] opacity-90">{tr('nextDoseIn', { t: '' }).trim()}</p>
              <p className="text-[28px] font-semibold leading-9">{Math.floor(next.minutes / 60)}h {String(next.minutes % 60).padStart(2, '0')}m</p>
              <p className="text-[13px] font-semibold">{slotTime(next.slot)} · {next.meds.map((m) => m.name.split(' ')[0]).join(', ')}</p>
            </div>
          ) : scheduled.length > 0 && (
            <div className="grad-mint rounded-lg p-4 text-safe"><p className="font-semibold">{tr('allDoneToday')}</p></div>
          )}
          <MiniMonth sel={sel} setSel={(d) => { setSel(d); }} items={scheduled} today={today} nowMin={nowMin} locale={locale} tr={tr} />
          <div className="hidden flex-col gap-1 lg:flex">
            <p className="px-1 pb-1.5 text-[14px] font-semibold leading-[18px]">{tr('times')}</p>
            {usedSlots.map((s) => (
              <p key={s} className="flex h-[30px] items-center gap-2.5 px-1">
                <span className="size-3.5 shrink-0 rounded-[4px]" style={{ background: SLOT_COLOR[s] }} aria-hidden="true" />
                <span className="flex-1 text-[14px] leading-[18px]">{tr(s)}</span>
                <span className="text-[13px] leading-4 text-ink-2">{slotTime(s)}</span>
              </p>
            ))}
            <p className="flex h-[30px] items-center gap-2.5 px-1">
              <span className="size-3.5 shrink-0 rounded-[4px] border-[1.5px] border-danger bg-white" aria-hidden="true" />
              <span className="flex-1 text-[14px] leading-[18px]">{tr('missed')}</span>
            </p>
          </div>
        </aside>

        {mode === 'month'
          ? <MonthGrid sel={sel} items={scheduled} today={today} nowMin={nowMin} onPick={(day) => { setSel(toDate(day)); setMode('day'); }} locale={locale} />
          : <TimeGrid days={days} items={scheduled} today={today} nowMin={nowMin} onOpen={onOpen} tr={tr} locale={locale} />}
      </div>
      {pop && <DosePopover key={`${pop.day}${pop.slot}`} pop={pop} items={scheduled} today={today} onClose={() => setPop(null)} />}
    </div>
  );
}
