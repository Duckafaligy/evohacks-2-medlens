import { useState } from 'react';
import { CalendarPlus, Check, ChevronLeft, ChevronRight, Download, Printer } from 'lucide-react';
import { useApp, useCabinet, useNow } from '../components/ctx.js';
import { Button } from '../components/ui.jsx';
import { downloadIcs, googleCalendarUrl } from '../lib/ics.js';
import * as cabinet from '../lib/cabinet.js';
import { SLOTS, localDay, colorFor, activeOn, slotMinutes, slotTime } from '../lib/app.js';

const START = 6; // 6 AM
const END = 24; // grid runs to midnight (last label 11 PM)
const HOUR = 44; // px per hour (scaled by rem in Senior Mode via CSS var below)

function weekStart(offset) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7); // Monday
  return d;
}

export default function Calendar() {
  const { tr, lang, openFridge } = useApp();
  const { items } = useCabinet();
  const now = useNow(60000);
  const [offset, setOffset] = useState(0);
  const start = weekStart(offset);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });
  const today = localDay(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const locale = lang === 'zh' ? 'zh-CN' : lang;
  const scheduled = items.filter((m) => m.slots?.length);
  const hours = Array.from({ length: END - START }, (_, i) => i + START);
  const top = (min) => ((min - START * 60) / 60) * HOUR;
  const food = (m) => ({ with: tr('withFood'), before: tr('beforeFood'), without: tr('emptyStomach') })[m.withFood];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="mr-2 text-h2 md:text-h1">
          {days[0].toLocaleDateString(locale, { month: 'short', day: 'numeric' })} – {days[6].toLocaleDateString(locale, days[0].getMonth() === days[6].getMonth() ? { day: 'numeric' } : { month: 'short', day: 'numeric' })}
        </h1>
        <div className="flex gap-1">
          <button type="button" onClick={() => setOffset(offset - 1)} aria-label={tr('prevWeek')} className="grid size-10 place-items-center rounded-md border border-control bg-surface hover:bg-canvas"><ChevronLeft className="size-4" /></button>
          <button type="button" onClick={() => setOffset(offset + 1)} aria-label={tr('nextWeek')} className="grid size-10 place-items-center rounded-md border border-control bg-surface hover:bg-canvas"><ChevronRight className="size-4" /></button>
        </div>
        <button type="button" onClick={() => setOffset(0)} className="h-10 rounded-md border border-control bg-surface px-4 font-semibold hover:bg-canvas">{tr('today')}</button>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="secondary" onClick={openFridge}><Printer className="size-5" aria-hidden="true" />{tr('printCard')}</Button>
          <Button variant="secondary" disabled={!scheduled.length} onClick={() => downloadIcs(scheduled, { lang })}><Download className="size-5" aria-hidden="true" />{tr('downloadIcs')}</Button>
          <details className="relative">
            <summary className="btn flex cursor-pointer list-none items-center gap-2 rounded-md border border-control bg-surface px-5 font-semibold hover:bg-canvas">
              <CalendarPlus className="size-5" aria-hidden="true" />{tr('googleCalendar')}
            </summary>
            <div className="pop absolute right-0 z-30 mt-2 w-80 space-y-1 rounded-md border border-line bg-surface p-2 shadow-xl">
              {scheduled.length === 0 && <p className="p-2 text-small text-ink-2">{tr('emptyTitle')}</p>}
              {scheduled.flatMap((m) => m.slots.map((s) => (
                <a key={m.id + s} href={googleCalendarUrl(m, s, new Date(), { lang })} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-sm px-2 py-2 hover:bg-canvas">
                  <span className="size-2.5 rounded-full" style={{ background: colorFor(items, m.id) }} aria-hidden="true" />
                  <span className="flex-1 font-semibold">{m.name} {m.strength}</span>
                  <span className="text-small text-ink-2">{slotTime(s)}</span>
                </a>
              )))}
            </div>
          </details>
        </div>
      </header>

      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <div className="min-w-[820px]">
          <div className="sticky top-0 z-20 grid border-b border-line bg-surface" style={{ gridTemplateColumns: '64px repeat(7, minmax(0,1fr))' }}>
            <div className="self-end px-2 pb-2 text-[12px] text-ink-2">{Intl.DateTimeFormat().resolvedOptions().timeZone.split('/').pop().replace('_', ' ')}</div>
            {days.map((d) => {
              const isToday = localDay(d) === today;
              return (
                <div key={d.toISOString()} className={`flex items-center gap-2 border-l border-line px-3 py-3 ${isToday ? 'bg-primary-soft/50' : ''}`}>
                  <span className={`text-small ${isToday ? 'font-semibold text-primary' : 'text-ink-2'}`}>{d.toLocaleDateString(locale, { weekday: 'short' })}</span>
                  <span className={`grid size-9 place-items-center text-h3 ${isToday ? 'rounded-full bg-primary font-semibold text-white' : 'font-semibold'}`}>{d.getDate()}</span>
                </div>
              );
            })}
          </div>

          <div className="relative grid" style={{ gridTemplateColumns: '64px repeat(7, minmax(0,1fr))', height: hours.length * HOUR }}>
            <div className="relative">
              {hours.map((h) => (
                <span key={h} className="absolute right-2 -translate-y-1/2 text-[12px] text-ink-2" style={{ top: top(h * 60) + (h === START ? 8 : 0) }}>
                  {new Date(2000, 0, 1, h).toLocaleTimeString(locale, { hour: 'numeric' })}
                </span>
              ))}
            </div>
            {days.map((d) => {
              const day = localDay(d);
              const isToday = day === today;
              const taken = cabinet.takenOn(day);
              return (
                <div key={day} className={`relative border-l border-line ${isToday ? 'bg-primary-soft/25' : ''}`} aria-label={d.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })} role="group">
                  {hours.map((h) => <div key={h} className="absolute inset-x-0 border-t border-line" style={{ top: top(h * 60) }} aria-hidden="true" />)}
                  {SLOTS.map((slot) => {
                    const due = scheduled.filter((m) => m.slots.includes(slot) && activeOn(m, day));
                    if (!due.length) return null;
                    const single = due.length === 1;
                    return (
                      <div key={slot} className="absolute inset-x-1 z-10 space-y-0.5" style={{ top: top(slotMinutes(slot)) + 2 }}>
                        {due.map((m) => {
                          const done = taken.some((t) => t.id === m.id && t.slot === slot);
                          const missed = !done && (day < today || (isToday && slotMinutes(slot) + 60 < nowMin));
                          const c = colorFor(items, m.id);
                          return (
                            <div key={m.id} title={`${m.name} ${m.strength} · ${slotTime(slot)}`}
                              className={`rounded-sm border-l-[3px] px-1.5 py-0.5 text-[12px] leading-tight ${done ? 'opacity-55' : ''}`}
                              style={{ borderColor: c, borderLeftStyle: missed ? 'dashed' : 'solid', background: missed ? 'var(--color-canvas)' : `${c}14`, color: missed ? 'var(--color-ink-2)' : c }}>
                              <p className="flex items-center gap-1 truncate font-semibold">
                                {done && <Check className="size-3 shrink-0" strokeWidth={3} aria-label={tr('taken')} />}
                                <span className="truncate">{m.name} {m.strength}</span>
                              </p>
                              {single && <p className="truncate opacity-80">{missed ? tr('missed') : `${slotTime(slot)}${food(m) ? ` · ${food(m)}` : ''}`}</p>}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                  {isToday && nowMin >= START * 60 && (
                    <div className="absolute inset-x-0 z-20 flex items-center" style={{ top: top(nowMin) }} aria-label={tr('now')}>
                      <span className="-ml-1 size-2.5 rounded-full bg-danger" />
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
  );
}
