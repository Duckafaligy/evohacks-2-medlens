// Week planner — ported from Paper "Today · Week" (App Dashboard). One block per dose time per day.
import { useState } from 'react';
import { CalendarPlus, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useApp, useCabinet, useNow } from '../components/ctx.js';
import { downloadIcs, googleCalendarUrl } from '../lib/ics.js';
import * as cabinet from '../lib/cabinet.js';
import { SLOTS, localDay, activeOn, slotMinutes, slotTime, colorFor } from '../lib/app.js';

const START = 7; // 7 AM
const ROWS = 16; // 7 AM – 10 PM labels
const H = 44;
const LINE = '#E5E9EF';
const SLOT_COLOR = { morning: '#1849A9', noon: '#0E6A80', evening: '#12704F', bedtime: '#4A5A72' };
const top = (min) => ((min - START * 60) / 60) * H;
const tz = () => new Date().toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop();
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
function mondayOf(offset) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7);
  return d;
}

const CheckCircle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" className="shrink-0" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="none" stroke="#FFFFFF" strokeWidth="2.6" />
    <path d="M8 12l3 3 5-6" fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function DoseBlock({ slot, meds, day, today, nowMin, tr, locale }) {
  const taken = cabinet.takenOn(day);
  const done = meds.filter((m) => taken.some((t) => t.id === m.id && t.slot === slot)).length;
  const past = day < today || (day === today && slotMinutes(slot) + 60 < nowMin);
  const missed = past && done === 0;
  const all = done === meds.length;
  const big = meds.length >= 3;
  const names = meds.map((m) => m.name.split(' ')[0]).join(', ');
  const shortTime = new Date(2000, 0, 1, Math.floor(slotMinutes(slot) / 60), slotMinutes(slot) % 60)
    .toLocaleTimeString(locale, { hour: 'numeric', minute: slotMinutes(slot) % 60 ? '2-digit' : undefined });
  const canMark = day <= today;
  const toggle = () => canMark && meds.forEach((m) => cabinet.markTaken(m.id, day, slot, !all));
  const label = `${tr(slot)} ${slotTime(slot)}: ${meds.map((m) => `${m.name} ${m.strength}`).join(', ')}. ${missed ? tr('missed') : all ? tr('allTaken') : tr('nOfM', { n: done, m: meds.length })}`;
  return (
    <button type="button" onClick={toggle} disabled={!canMark} aria-label={label} aria-pressed={all}
      className="absolute inset-x-1 z-10 flex flex-col gap-0.5 overflow-hidden rounded-sm px-[7px] py-[5px] text-left disabled:cursor-default"
      style={{
        top: top(slotMinutes(slot)) + 1,
        height: (big ? 1.5 : 1) * H - 1,
        background: missed ? '#FFFFFF' : SLOT_COLOR[slot],
        border: missed ? '1.5px solid #B4232A' : 'none',
      }}>
      <span className="flex items-center justify-between gap-1">
        <span className="truncate text-[12px] font-semibold leading-[15px]" style={{ color: missed ? '#B4232A' : '#FFFFFF' }}>
          {missed ? `${tr('missed')} · ${shortTime}` : slotTime(slot)}
        </span>
        {!missed && (all ? <CheckCircle /> : done > 0 && <span className="shrink-0 text-[11px] font-semibold leading-[13px] text-white">{tr('nOfM', { n: done, m: meds.length })}</span>)}
      </span>
      <span className="text-[11px] leading-[13px]" style={{ color: missed ? '#0F1B2D' : '#FFFFFF' }}>{names}</span>
    </button>
  );
}

function MiniMonth({ monday, setOffset, locale, today }) {
  const [shift, setShift] = useState(0);
  const first = new Date(monday.getFullYear(), monday.getMonth() + shift, 1);
  const start = addDays(first, -first.getDay()); // Sunday-first grid
  const weeks = Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)))
    .filter((w) => w.some((d) => d.getMonth() === first.getMonth()));
  const inWeek = (d) => d >= addDays(monday, -0.5) && d < addDays(monday, 6.5);
  const heads = Array.from({ length: 7 }, (_, i) => addDays(new Date(2023, 0, 1), i).toLocaleDateString(locale, { weekday: 'narrow' }));
  const jump = (d) => {
    const thisMon = mondayOf(0);
    const mon = addDays(d, -((d.getDay() + 6) % 7));
    setOffset(Math.round((mon - thisMon) / (7 * 864e5)));
    setShift(0);
  };
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between px-1 pb-1">
        <p className="text-[14px] font-semibold leading-[18px]">{first.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</p>
        <span className="flex gap-1.5 text-ink-2">
          <button type="button" onClick={() => setShift(shift - 1)} aria-label="Previous month"><ChevronLeft className="size-3.5" strokeWidth={2.4} /></button>
          <button type="button" onClick={() => setShift(shift + 1)} aria-label="Next month"><ChevronRight className="size-3.5" strokeWidth={2.4} /></button>
        </span>
      </div>
      <div className="flex">{heads.map((h, i) => <span key={i} className="flex-1 text-center text-[11px] font-semibold leading-[14px] text-ink-2" aria-hidden="true">{h}</span>)}</div>
      {weeks.map((w, i) => (
        <div key={i} className="flex">
          {w.map((d) => {
            const day = localDay(d);
            const isToday = day === today;
            const out = d.getMonth() !== first.getMonth();
            const hl = !isToday && inWeek(d);
            return (
              <button key={day} type="button" onClick={() => jump(d)} aria-label={d.toLocaleDateString(locale, { dateStyle: 'full' })}
                className="flex h-7 flex-1 items-center justify-center">
                <span className={`grid size-[26px] place-items-center rounded-full text-[12px] leading-4 ${isToday ? 'bg-primary font-semibold text-white' : hl ? 'bg-primary-soft text-primary' : out ? 'text-[#9AA6B8]' : 'text-ink'}`}>
                  {d.getDate()}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default function Calendar({ mode = 'week', onMode }) {
  const { tr, lang } = useApp();
  const { items } = useCabinet();
  const now = useNow(60000);
  const [offset, setOffset] = useState(0);
  const locale = lang === 'zh' ? 'zh-CN' : lang;
  const today = localDay(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const scheduled = items.filter((m) => m.slots?.length);
  const monday = mondayOf(offset);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const usedSlots = SLOTS.filter((s) => scheduled.some((m) => m.slots.includes(s)));
  const BTN = 'flex h-9 items-center gap-1.5 rounded-[8px] border border-line bg-surface px-3 text-[14px] font-semibold leading-[18px] text-ink hover:bg-canvas';

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setOffset(0)} className={`${BTN} px-4`}>{tr('today')}</button>
        <div className="flex gap-0.5">
          <button type="button" onClick={() => setOffset(offset - 1)} aria-label={tr('prevWeek')} className="grid size-9 place-items-center rounded-[8px] text-ink-2 hover:bg-surface"><ChevronLeft className="size-[18px]" /></button>
          <button type="button" onClick={() => setOffset(offset + 1)} aria-label={tr('nextWeek')} className="grid size-9 place-items-center rounded-[8px] text-ink-2 hover:bg-surface"><ChevronRight className="size-[18px]" /></button>
        </div>
        <h2 className="flex-1 text-[22px] font-normal leading-7">{monday.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</h2>
        {onMode && (
          <div role="radiogroup" aria-label={tr('navToday')} className="flex h-9 gap-0.5 rounded-[8px] p-0.5" style={{ background: '#E9EDF2' }}>
            {['day', 'week'].map((m) => (
              <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => onMode(m)}
                className={`flex h-8 items-center rounded-sm border px-3.5 text-[14px] leading-[18px] ${mode === m ? 'border-line bg-surface font-semibold text-ink' : 'border-transparent text-ink-2 hover:text-ink'}`}>
                {tr(m === 'day' ? 'dayView' : 'weekView')}
              </button>
            ))}
          </div>
        )}
        <button type="button" disabled={!scheduled.length} onClick={() => downloadIcs(scheduled, { lang })} className={`${BTN} disabled:opacity-50`}>
          <Download className="size-[15px]" aria-hidden="true" />{tr('downloadIcs')}
        </button>
        <details className="relative">
          <summary className={`${BTN} cursor-pointer list-none`}><CalendarPlus className="size-[15px]" aria-hidden="true" />{tr('googleCalendar')}</summary>
          <div className="pop absolute right-0 z-30 mt-2 w-80 space-y-1 rounded-md border border-line bg-surface p-2 shadow-xl">
            {scheduled.length === 0 && <p className="p-2 text-small text-ink-2">{tr('emptyTitle')}</p>}
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
        <aside className="flex w-full shrink-0 flex-col gap-6 sm:flex-row lg:w-[196px] lg:flex-col">
          <MiniMonth monday={monday} setOffset={setOffset} locale={locale} today={today} />
          <div className="flex flex-col gap-1" aria-labelledby="times-h">
            <p id="times-h" className="px-1 pb-1.5 text-[14px] font-semibold leading-[18px]">{tr('times')}</p>
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

        <div className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-line bg-surface">
          <div className="min-w-[720px]">
            <div className="flex border-b" style={{ borderColor: LINE }}>
              <div className="flex w-14 shrink-0 items-end justify-end pb-2 pr-2 text-[10px] leading-3 text-ink-2">{tz()}</div>
              {days.map((d) => {
                const isToday = localDay(d) === today;
                return (
                  <div key={d.toISOString()} className="flex flex-1 flex-col items-center gap-0.5 py-2.5">
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
                      const meds = scheduled.filter((m) => m.slots.includes(slot) && activeOn(m, day));
                      return meds.length ? <DoseBlock key={slot} {...{ slot, meds, day, today, nowMin, tr, locale }} /> : null;
                    })}
                    {day === today && nowMin >= START * 60 && nowMin <= (START + ROWS) * 60 && (
                      <div className="absolute -left-1.5 right-0 z-20 flex h-2.5 items-center" style={{ top: top(nowMin) - 5 }} aria-label={tr('now')}>
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
      </div>
    </div>
  );
}
