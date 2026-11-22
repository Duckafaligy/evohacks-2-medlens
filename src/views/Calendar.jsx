import { Fragment, useState } from 'react';
import { CalendarPlus, Check, ChevronLeft, ChevronRight, ExternalLink, Printer } from 'lucide-react';
import { useApp, useCabinet } from '../components/ctx.js';
import { Button } from '../components/ui.jsx';
import { downloadIcs, googleCalendarUrl } from '../lib/ics.js';
import * as cabinet from '../lib/cabinet.js';
import { SLOTS, SLOT_TIMES, localDay } from '../lib/app.js';

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6:00–23:00
const COLORS = [
  'bg-primary-soft border-primary text-primary',
  'bg-safe-soft border-safe text-safe',
  'bg-caution-soft border-caution text-caution',
  'bg-info-soft border-info text-info',
  'bg-danger-soft border-danger text-danger',
  'bg-canvas border-ink-2 text-ink',
];
const hourOf = (slot) => Number(SLOT_TIMES[slot].split(':')[0]);

function weekStart(offset) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7); // Monday
  return d;
}

// A short course (days) runs from the day it was added.
const activeOn = (m, day) => {
  if (!m.days) return true;
  const start = localDay(new Date(m.scannedAt || Date.now()));
  const end = new Date(`${start}T12:00`);
  end.setDate(end.getDate() + m.days - 1);
  return day >= start && day <= localDay(end);
};

export default function Calendar() {
  const { tr, lang, openFridge } = useApp();
  const { items } = useCabinet();
  const [offset, setOffset] = useState(0);
  const start = weekStart(offset);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });
  const today = localDay();
  const locale = lang === 'zh' ? 'zh-CN' : lang;
  const color = (m) => COLORS[items.findIndex((i) => i.id === m.id) % COLORS.length];
  const scheduled = items.filter((m) => m.slots?.length);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-h2 md:text-h1">{tr('navCalendar')}</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={openFridge}><Printer className="size-5" aria-hidden="true" />{tr('printCard')}</Button>
          <Button disabled={!scheduled.length} onClick={() => downloadIcs(scheduled, { lang })}><CalendarPlus className="size-5" aria-hidden="true" />{tr('downloadIcs')}</Button>
        </div>
      </header>

      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setOffset(offset - 1)} aria-label={tr('prevWeek')} className="btn grid w-12 place-items-center rounded-md border border-control bg-surface"><ChevronLeft className="size-5" /></button>
        <p className="min-w-48 text-center font-semibold" aria-live="polite">
          {days[0].toLocaleDateString(locale, { month: 'short', day: 'numeric' })} – {days[6].toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
        </p>
        <button type="button" onClick={() => setOffset(offset + 1)} aria-label={tr('nextWeek')} className="btn grid w-12 place-items-center rounded-md border border-control bg-surface"><ChevronRight className="size-5" /></button>
        {offset !== 0 && <Button variant="ghost" onClick={() => setOffset(0)}>{tr('thisWeek')}</Button>}
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <div className="grid min-w-[760px]" style={{ gridTemplateColumns: '64px repeat(7, minmax(0, 1fr))' }} role="grid" aria-label={tr('navCalendar')}>
          <div className="sticky top-0 border-b border-line bg-surface" />
          {days.map((d) => {
            const isToday = localDay(d) === today;
            return (
              <div key={d.toISOString()} role="columnheader" className={`border-b border-l border-line p-2 text-center ${isToday ? 'bg-primary-soft' : ''}`}>
                <span className="block text-small text-ink-2">{d.toLocaleDateString(locale, { weekday: 'short' })}</span>
                <span className={`text-lead font-semibold ${isToday ? 'text-primary' : ''}`}>{d.getDate()}</span>
              </div>
            );
          })}
          {HOURS.map((h) => (
            <Fragment key={h}>
              <div className="border-b border-line px-2 py-1 text-right text-small text-ink-2" role="rowheader">
                {new Date(2000, 0, 1, h).toLocaleTimeString(locale, { hour: 'numeric' })}
              </div>
              {days.map((d) => {
                const day = localDay(d);
                const slot = SLOTS.find((s) => hourOf(s) === h);
                const due = slot ? scheduled.filter((m) => m.slots.includes(slot) && activeOn(m, day)) : [];
                const taken = due.length ? cabinet.takenOn(day) : [];
                return (
                  <div key={day} role="gridcell" className={`min-h-12 space-y-1 border-b border-l border-line p-1 ${day === today ? 'bg-primary-soft/40' : ''}`}>
                    {due.map((m) => {
                      const done = taken.some((t) => t.id === m.id && t.slot === slot);
                      return (
                        <div key={m.id} className={`flex items-center gap-1 rounded-sm border-l-4 px-1.5 py-1 text-[13px] font-semibold leading-tight ${color(m)} ${done ? 'opacity-60' : ''}`}>
                          {done && <Check className="size-3.5 shrink-0" aria-label={tr('taken')} />}
                          <span className="truncate">{m.name} {m.strength}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      {scheduled.length > 0 && (
        <section aria-labelledby="gcal-h">
          <h2 id="gcal-h" className="mb-3 text-h3">{tr('googleCalendar')}</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {scheduled.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-2 rounded-md border border-line bg-surface p-4">
                <span className="flex-1 font-semibold">{m.name} {m.strength}</span>
                {m.slots.map((s) => (
                  <a key={s} href={googleCalendarUrl(m, s, new Date(), { lang })} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-sm bg-primary-soft px-2 py-1 text-small font-semibold text-primary hover:underline">
                    {tr(s)}<ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                ))}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
