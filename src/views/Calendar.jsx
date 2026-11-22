// Calendar — ported from Paper "Calendar · Desktop" (App Dashboard). Values are copied from the board.
import { useState } from 'react';
import { CalendarPlus, Check, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useApp, useCabinet, useNow } from '../components/ctx.js';
import { downloadIcs, googleCalendarUrl } from '../lib/ics.js';
import * as cabinet from '../lib/cabinet.js';
import { SLOTS, localDay, colorFor, softFor, activeOn, slotMinutes, slotTime } from '../lib/app.js';

const START = 6; // first row 6 AM
const ROWS = 18; // 6 AM – midnight
const H = 44; // px per hour (board value)
const top = (min) => ((min - START * 60) / 60) * H;

const BTN = 'flex h-9 items-center gap-2 rounded-md border border-line bg-surface px-3.5 text-[14px] font-semibold leading-[18px] text-ink hover:bg-canvas';
const SQ = 'grid size-9 place-items-center rounded-md border border-line bg-surface text-ink hover:bg-canvas';

const short = (m) => `${m.name.split(' ')[0]} ${(m.strength || '').match(/[\d.]+/)?.[0] || ''}`.trim();
const tz = () => new Date().toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop();

function startOf(mode, offset) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  if (mode === 'day') d.setDate(d.getDate() + offset);
  if (mode === 'week') d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7); // Monday
  if (mode === 'month') { d.setDate(1); d.setMonth(d.getMonth() + offset); }
  return d;
}
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

function Event({ m, slot, day, today, nowMin, taken, all, stacked, tr }) {
  const done = taken.some((t) => t.id === m.id && t.slot === slot);
  const missed = !done && (day < today || (day === today && slotMinutes(slot) + 60 < nowMin));
  const c = missed ? '#A14A06' : colorFor(all, m.id);
  const bg = missed ? '#FDF0E1' : softFor(c);
  const slate = c === '#46536A';
  const nameColor = slate ? '#0F1B2D' : c;
  const metaColor = slate ? '#46536A' : c;
  const food = ({ with: tr('withFood'), before: tr('beforeFood'), without: tr('emptyStomach') })[m.withFood];
  const label = `${m.name} ${m.strength} · ${slotTime(slot)}${done ? ` · ${tr('taken')}` : missed ? ` · ${tr('missed')}` : ''}`;
  if (stacked) {
    return (
      <div title={label} aria-label={label} className="flex h-6 shrink-0 items-center gap-1.5 overflow-hidden rounded-sm pr-1.5" style={{ background: bg, opacity: done ? 0.6 : 1 }}>
        <span className="w-[3px] self-stretch" style={{ background: c }} aria-hidden="true" />
        {done && <Check className="size-3 shrink-0" strokeWidth={3} style={{ color: c }} aria-hidden="true" />}
        <span className="truncate text-[12px] font-semibold leading-[14px]" style={{ color: nameColor }}>{short(m)}</span>
      </div>
    );
  }
  return (
    <div title={label} aria-label={label} className="flex h-10 overflow-hidden rounded-sm" style={{ background: bg, opacity: done ? 0.6 : 1 }}>
      <span className="w-[3px] shrink-0" style={{ background: c }} aria-hidden="true" />
      <span className="flex min-w-0 flex-col px-1.5 py-1">
        <span className="truncate text-[12px] font-semibold leading-[15px]" style={{ color: nameColor }}>{done ? '✓ ' : ''}{short(m)}</span>
        <span className="truncate text-[11px] leading-[14px]" style={{ color: metaColor }}>{missed ? tr('missed') : `${slotTime(slot)} · ${(food || tr(slot)).toLowerCase()}`}</span>
      </span>
    </div>
  );
}

function TimeGrid({ days, items, all, today, nowMin, locale, tr }) {
  const cols = `64px repeat(${days.length}, minmax(0,1fr))`;
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <div className={days.length > 1 ? 'min-w-[820px]' : ''}>
        <div className="sticky top-0 z-20 grid border-b border-line bg-surface" style={{ gridTemplateColumns: cols }}>
          <div className="flex items-end justify-center pb-2.5 text-[12px] leading-4 text-ink-2">{tz()}</div>
          {days.map((d) => {
            const isToday = localDay(d) === today;
            return (
              <div key={d.toISOString()} className="flex items-center gap-2.5 border-l border-line p-3" style={{ background: isToday ? '#F7F9FC' : undefined }}>
                <span className={`text-[13px] leading-4 ${isToday ? 'font-semibold text-primary' : 'text-ink-2'}`}>{d.toLocaleDateString(locale, { weekday: 'short' })}</span>
                <span className={`grid size-[34px] shrink-0 place-items-center rounded-full text-[18px] font-semibold leading-[22px] ${isToday ? 'bg-primary text-white' : 'text-ink'}`}>{d.getDate()}</span>
              </div>
            );
          })}
        </div>
        <div className="relative grid" style={{ gridTemplateColumns: cols, height: ROWS * H }}>
          <div aria-hidden="true">
            {Array.from({ length: ROWS }, (_, i) => (
              <div key={i} className="h-11 pr-2.5 pt-1.5 text-right text-[12px] leading-[14px] text-ink-2">
                {new Date(2000, 0, 1, START + i).toLocaleTimeString(locale, { hour: 'numeric' })}
              </div>
            ))}
          </div>
          {Array.from({ length: ROWS - 1 }, (_, i) => (
            <div key={i} className="pointer-events-none absolute right-0 h-px bg-line" style={{ left: 64, top: (i + 1) * H }} aria-hidden="true" />
          ))}
          {days.map((d) => {
            const day = localDay(d);
            const taken = cabinet.takenOn(day);
            return (
              <div key={day} role="group" aria-label={d.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })} className="relative border-l border-line">
                {SLOTS.map((slot) => {
                  const due = items.filter((m) => m.slots?.includes(slot) && activeOn(m, day));
                  if (!due.length) return null;
                  const stacked = due.length > 1;
                  return (
                    <div key={slot} className="absolute inset-x-[5px] z-10 flex flex-col gap-[3px]" style={{ top: top(slotMinutes(slot)) + 2 }}>
                      {due.map((m) => <Event key={m.id} {...{ m, slot, day, today, nowMin, taken, all, stacked, tr }} />)}
                    </div>
                  );
                })}
                {day === today && nowMin >= START * 60 && (
                  <div className="absolute -left-1 right-0 z-20 flex h-2 items-center" style={{ top: top(nowMin) - 4 }} aria-label={tr('now')}>
                    <span className="size-2 shrink-0 rounded-full bg-danger" />
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

function MonthGrid({ first, items, all, today, locale, tr }) {
  const lead = (first.getDay() + 6) % 7; // Monday first
  const count = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => new Date(first.getFullYear(), first.getMonth(), i + 1))];
  const heads = Array.from({ length: 7 }, (_, i) => addDays(new Date(2024, 0, 1), i).toLocaleDateString(locale, { weekday: 'short' }));
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="grid grid-cols-7 border-b border-line">
        {heads.map((h) => <div key={h} className="p-3 text-[13px] leading-4 text-ink-2">{h}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          if (!d) return <div key={`b${i}`} className="min-h-24 border-b border-l border-line bg-canvas/50 first:border-l-0" />;
          const day = localDay(d);
          const taken = cabinet.takenOn(day);
          const doses = SLOTS.flatMap((s) => items.filter((m) => m.slots?.includes(s) && activeOn(m, day)).map((m) => [m, s]));
          return (
            <div key={day} className={`min-h-24 border-b border-line p-2 ${i % 7 ? 'border-l' : ''}`} style={{ background: day === today ? '#F7F9FC' : undefined }}
              aria-label={`${d.toLocaleDateString(locale, { month: 'long', day: 'numeric' })}: ${doses.length}`}>
              <span className={`grid size-7 place-items-center rounded-full text-[14px] font-semibold ${day === today ? 'bg-primary text-white' : ''}`}>{d.getDate()}</span>
              <div className="mt-1.5 flex flex-wrap gap-1" aria-hidden="true">
                {doses.map(([m, s]) => {
                  const done = taken.some((t) => t.id === m.id && t.slot === s);
                  const c = colorFor(all, m.id);
                  return <span key={m.id + s} title={`${m.name} · ${tr(s)}`} className="size-2 rounded-full border" style={{ borderColor: c, background: done ? c : 'transparent' }} />;
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Calendar() {
  const { tr, lang } = useApp();
  const { items } = useCabinet();
  const now = useNow(60000);
  const [mode, setMode] = useState('week');
  const [offset, setOffset] = useState(0);
  const locale = lang === 'zh' ? 'zh-CN' : lang;
  const today = localDay(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const scheduled = items.filter((m) => m.slots?.length);
  const start = startOf(mode, offset);
  const days = mode === 'day' ? [start] : Array.from({ length: 7 }, (_, i) => addDays(start, i));

  const title = mode === 'month' ? start.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
    : mode === 'day' ? start.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })
      : `${days[0].toLocaleDateString(locale, { month: 'short', day: 'numeric' })} – ${days[6].toLocaleDateString(locale, days[0].getMonth() === days[6].getMonth() ? { day: 'numeric' } : { month: 'short', day: 'numeric' })}`;
  const setM = (m) => { setMode(m); setOffset(0); };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-[32px] font-semibold leading-10 tracking-[-0.02em]">{title}</h1>
          <div className="flex gap-1">
            <button type="button" onClick={() => setOffset(offset - 1)} aria-label={tr('prevWeek')} className={SQ}><ChevronLeft className="size-4" /></button>
            <button type="button" onClick={() => setOffset(offset + 1)} aria-label={tr('nextWeek')} className={SQ}><ChevronRight className="size-4" /></button>
          </div>
          <button type="button" onClick={() => setOffset(0)} className={BTN}>{tr('today')}</button>
          <div role="radiogroup" aria-label={tr('navCalendar')} className="flex gap-0.5 rounded-md p-[3px]" style={{ background: '#E9EDF2' }}>
            {['day', 'week', 'month'].map((m) => (
              <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setM(m)}
                className={`h-[30px] rounded-[8px] border px-3.5 text-[14px] leading-[18px] ${mode === m ? 'border-line bg-surface font-semibold text-ink' : 'border-transparent text-ink-2 hover:text-ink'}`}>
                {tr(`mode_${m}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" disabled={!scheduled.length} onClick={() => downloadIcs(scheduled, { lang })} className={`${BTN} disabled:opacity-50`}>
            <Download className="size-4" aria-hidden="true" />{tr('downloadIcs')}
          </button>
          <details className="relative">
            <summary className={`${BTN} cursor-pointer list-none`}><CalendarPlus className="size-4" aria-hidden="true" />{tr('googleCalendar')}</summary>
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
        </div>
      </header>

      {mode === 'month'
        ? <MonthGrid first={start} items={scheduled} all={items} today={today} locale={locale} tr={tr} />
        : <TimeGrid days={days} items={scheduled} all={items} today={today} nowMin={nowMin} locale={locale} tr={tr} />}
    </div>
  );
}
