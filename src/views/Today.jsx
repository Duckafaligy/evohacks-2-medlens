import { Fragment, useState } from 'react';
import {
  AlertTriangle, ArrowRight, Check, ChevronLeft, ChevronRight, Droplet, Utensils, Clock, Ban, ScanLine, Printer,
} from 'lucide-react';
import { useApp, useCabinet, useInteractions, useNow } from '../components/ctx.js';
import { Button, Chip, FoodChips } from '../components/ui.jsx';
import * as cabinet from '../lib/cabinet.js';
import { SLOTS, slotTime, nextDose, localDay, colorFor, activeOn, slotMinutes } from '../lib/app.js';
import { SCENARIOS } from '../data/scenarios.js';

const fmtDur = (min) => `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m`;
const clock = (d) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

function Empty() {
  const { tr, lang, go, tryExample } = useApp();
  return (
    <div className="grad-calm rise rounded-lg p-8 md:p-12">
      <h2 className="text-h2">{tr('emptyTitle')}</h2>
      <p className="mt-2 text-lead text-ink-2">{tr('emptyBody')}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={() => go('scan')}><ScanLine className="size-5" aria-hidden="true" />{tr('navScan')}</Button>
        {SCENARIOS.map((s) => (
          <Button key={s.id} variant="secondary" onClick={() => tryExample(s.id)}>{s.title[lang]}</Button>
        ))}
      </div>
    </div>
  );
}

/** One short hint per med: food rule first, then water. */
function Hint({ med }) {
  const { tr } = useApp();
  const [Icon, key] = med.withFood === 'with' ? [Utensils, 'withFood']
    : med.withFood === 'before' ? [Clock, 'beforeFood']
      : med.withFood === 'without' ? [Ban, 'emptyStomach']
        : med.water ? [Droplet, 'fullGlassWater'] : [null, null];
  if (!Icon) return null;
  return <span className="hidden items-center gap-1.5 text-small text-ink-2 sm:flex"><Icon className="size-4" aria-hidden="true" />{tr(key)}</span>;
}

function MedRow({ med, slot, day, items, taken }) {
  const { tr } = useApp();
  const t = taken.find((x) => x.id === med.id && x.slot === slot);
  return (
    <div className={`flex items-center gap-3 rounded-md border px-4 py-2.5 ${t ? 'border-line bg-surface' : 'border-line bg-surface'}`}>
      <span className="size-2.5 shrink-0 rounded-full" style={{ background: colorFor(items, med.id) }} aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate"><span className="font-semibold">{med.name}</span> <span className="text-ink-2">{med.strength}</span></span>
      <Hint med={med} />
      {t?.at && <span className="hidden text-small font-semibold text-safe md:inline">{clock(new Date(t.at))}</span>}
      <button
        type="button"
        onClick={() => cabinet.markTaken(med.id, day, slot, !t)}
        aria-pressed={!!t}
        aria-label={tr('markTaken', { name: `${med.name} ${med.strength}` })}
        className={`grid size-8 shrink-0 place-items-center rounded-full border-2 transition-colors ${t ? 'border-safe bg-safe text-white' : 'border-control bg-surface hover:border-primary'}`}
      >
        {t && <Check className="size-4" strokeWidth={3} aria-hidden="true" />}
      </button>
    </div>
  );
}

function MonthCalendar({ items, now }) {
  const { tr, lang } = useApp();
  const locale = lang === 'zh' ? 'zh-CN' : lang;
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysIn = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const today = localDay(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const cells = Array.from({ length: daysIn }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), i + 1);
    const day = localDay(d);
    if (day > today) return { d, day, state: 'future' };
    const sched = items.flatMap((m) => (activeOn(m, day) ? (m.slots || []).map((s) => [m.id, s]) : []))
      .filter(([, s]) => day < today || slotMinutes(s) <= nowMin);
    if (!sched.length) return { d, day, state: day === today ? 'future' : 'none' };
    const tk = cabinet.takenOn(day);
    const n = sched.filter(([id, s]) => tk.some((x) => x.id === id && x.slot === s)).length;
    return { d, day, state: n === sched.length ? 'all' : 'partial', due: sched.length, done: n };
  });
  const hasHistory = cells.some((c) => c.day < today && c.due);
  const due = cells.reduce((a, c) => a + (c.due || 0), 0);
  const done = cells.reduce((a, c) => a + (c.done || 0), 0);
  const dot = { all: 'bg-safe', partial: 'bg-caution', future: 'bg-control', none: '' };
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2023, 0, 1 + i).toLocaleDateString(locale, { weekday: 'narrow' }));
  return (
    <section className="rounded-lg border border-line bg-surface p-5" aria-labelledby="month-h">
      <div className="flex items-baseline justify-between">
        <h2 id="month-h" className="text-lead font-semibold">{now.toLocaleDateString(locale, { month: 'long' })}</h2>
        {hasHistory && due > 0 && <span className="text-small font-semibold text-safe">{tr('onTime', { n: Math.round((done / due) * 100) })}</span>}
      </div>
      <div className="mt-3 grid grid-cols-7 gap-y-1 text-center text-small">
        {weekdays.map((w, i) => <span key={i} className="pb-1 text-ink-2" aria-hidden="true">{w}</span>)}
        {Array.from({ length: first.getDay() }, (_, i) => <span key={`b${i}`} />)}
        {cells.map(({ d, day, state }) => (
          <span key={day} className="flex flex-col items-center gap-0.5 py-0.5"
            aria-label={`${d.toLocaleDateString(locale, { month: 'long', day: 'numeric' })}${state === 'all' ? `, ${tr('allTaken')}` : state === 'partial' ? `, ${tr('someTaken')}` : ''}`}>
            <span className={`grid size-8 place-items-center rounded-md ${day === today ? 'bg-primary font-semibold text-white' : ''}`}>{d.getDate()}</span>
            <span className={`size-1.5 rounded-full ${dot[state]}`} aria-hidden="true" />
          </span>
        ))}
      </div>
    </section>
  );
}

export default function Today() {
  const { tr, lang, go, openFridge } = useApp();
  const { items } = useCabinet();
  const now = useNow();
  const [offset, setOffset] = useState(0);
  const viewDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
  const day = localDay(viewDate);
  const isToday = offset === 0;
  const taken = cabinet.takenOn(day);
  const inter = useInteractions(items);
  const warn = inter?.interactions.find((x) => x.severity !== 'Low');

  const dayItems = items.filter((m) => activeOn(m, day) || (isToday && !m.days));
  const plan = SLOTS.map((slot) => ({ slot, meds: dayItems.filter((m) => m.slots?.includes(slot)) }));
  const total = plan.reduce((n, p) => n + p.meds.length, 0);
  const doneCount = plan.reduce((n, p) => n + p.meds.filter((m) => taken.some((t) => t.id === m.id && t.slot === p.slot)).length, 0);
  const next = isToday ? nextDose(dayItems, taken, now) : null;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const greet = now.getHours() < 12 ? 'goodMorning' : now.getHours() < 18 ? 'goodAfternoon' : 'goodEvening';
  const prn = items.filter((i) => i.prn);
  const locale = lang === 'zh' ? 'zh-CN' : lang;
  const nowIndex = isToday ? plan.findIndex((p) => slotMinutes(p.slot) > nowMin) : -2;


  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <p className="text-ink-2">{now.toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
        <div className="flex gap-2">
          {items.length > 0 && <Button variant="secondary" onClick={openFridge}><Printer className="size-5" aria-hidden="true" />{tr('printCard')}</Button>}
          <Button onClick={() => go('scan')}><ScanLine className="size-5" aria-hidden="true" />{tr('scanTitle')}</Button>
        </div>
      </div>

      <header>
        <h1 className="text-h2 md:text-h1">{tr(greet)}</h1>
        {total > 0 && isToday && (
          <p className="mt-1 text-lead text-ink-2">{total - doneCount > 0 ? tr('dosesLeft', { n: total - doneCount }) : tr('allDoneToday')}</p>
        )}
      </header>

      {warn && (
        <div role="alert" className={`warn-in flex flex-wrap items-center gap-3 rounded-md border px-5 py-3 ${warn.severity === 'High' ? 'border-danger/30 bg-danger-soft' : 'border-caution/30 bg-caution-soft'}`}>
          <AlertTriangle className={`size-5 ${warn.severity === 'High' ? 'text-danger' : 'text-caution'}`} aria-hidden="true" />
          <Chip tone={warn.severity === 'High' ? 'solidDanger' : 'caution'}>{tr(warn.severity.toLowerCase())}</Chip>
          <span className="flex-1 font-semibold">{warn.a} + {warn.b}</span>
          <span className="hidden text-small text-ink-2 sm:inline">{tr('askPharmacist')}</span>
          <a href="#/app/safety" className="flex items-center gap-1 font-semibold text-primary hover:underline">{tr('details')}<ArrowRight className="size-4" aria-hidden="true" /></a>
        </div>
      )}

      {items.length === 0 ? <Empty /> : (
        <div className="grid items-start gap-6 xl:grid-cols-[1fr_340px]">
          <section className="rounded-lg border border-line bg-surface p-5 md:p-7" aria-labelledby="plan-h">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 id="plan-h" className="text-h3">{isToday ? tr('todaysPlan') : viewDate.toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric' })}</h2>
                {total > 0 && (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-1.5 w-40 overflow-hidden rounded-sm bg-canvas" aria-hidden="true">
                      <div className="h-full bg-safe transition-[width] duration-300" style={{ width: `${(doneCount / total) * 100}%` }} />
                    </div>
                    <span className="font-semibold">{tr('dosesTaken', { n: doneCount, total })}</span>
                  </div>
                )}
              </div>
              <div className="flex overflow-hidden rounded-md border border-control" role="group" aria-label={tr('navToday')}>
                <button type="button" onClick={() => setOffset(offset - 1)} aria-label={tr('prevDay')} className="grid h-10 w-10 place-items-center hover:bg-canvas"><ChevronLeft className="size-4" /></button>
                <button type="button" onClick={() => setOffset(0)} className="h-10 border-x border-control px-3 font-semibold hover:bg-canvas">{tr('today')}</button>
                <button type="button" onClick={() => setOffset(offset + 1)} aria-label={tr('nextDay')} className="grid h-10 w-10 place-items-center hover:bg-canvas"><ChevronRight className="size-4" /></button>
              </div>
            </div>

            <ol className="relative mt-6">
              <span className="absolute bottom-3 top-3 left-[calc(5rem+0.75rem+11px)] w-px bg-line" aria-hidden="true" />
              {plan.map(({ slot, meds }, i) => {
                const doneAll = meds.length > 0 && meds.every((m) => taken.some((t) => t.id === m.id && t.slot === slot));
                const isNext = next?.slot === slot;
                const status = !meds.length ? null : doneAll ? <span className="text-small text-safe">{tr('allTaken')}</span>
                  : isNext ? <span className="text-small font-semibold text-primary">{tr('nextIn', { t: fmtDur(next.minutes) })}</span>
                    : <span className="text-small text-ink-2">{tr('nToTake', { n: meds.length })}</span>;
                return (
                  <Fragment key={slot}>
                    {nowIndex === i && <NowLine now={now} />}
                    <li className={`relative flex gap-3 ${meds.length ? 'py-2' : 'py-1'}`}>
                      <span className={`w-20 shrink-0 pt-0.5 text-right ${meds.length ? 'font-semibold' : 'text-small text-ink-2'}`}>{slotTime(slot)}</span>
                      <span className="relative z-10 grid w-6 shrink-0 place-items-start justify-center pt-0.5" aria-hidden="true">
                        {!meds.length ? <span className="mt-1.5 size-2.5 rounded-full border border-control bg-surface" />
                          : doneAll ? <span className="grid size-6 place-items-center rounded-full bg-safe text-white"><Check className="size-3.5" strokeWidth={3} /></span>
                            : <span className={`size-6 rounded-full border-2 bg-surface ${isNext ? 'border-primary' : 'border-control'}`} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        {meds.length === 0 ? (
                          <p className="text-small text-ink-2">{tr('nothingAt', { slot: tr(slot).toLowerCase() })}</p>
                        ) : (
                          <>
                            <p className="flex flex-wrap items-baseline gap-2"><span className="font-semibold">{tr(slot)}</span>{status}</p>
                            <div className="mt-2 space-y-2">
                              {meds.map((m) => <MedRow key={m.id} med={m} slot={slot} day={day} items={items} taken={taken} />)}
                            </div>
                          </>
                        )}
                      </div>
                    </li>
                  </Fragment>
                );
              })}
              {nowIndex === -1 && <NowLine now={now} />}
            </ol>

            {prn.length > 0 && (
              <div className="mt-6 border-t border-line pt-5">
                <h3 className="font-semibold">{tr('asNeeded')}</h3>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {prn.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 rounded-md border border-line px-4 py-2.5">
                      <span className="size-2.5 rounded-full" style={{ background: colorFor(items, m.id) }} aria-hidden="true" />
                      <span className="flex-1"><span className="font-semibold">{m.name}</span> <span className="text-ink-2">{m.strength}</span></span>
                      <FoodChips med={m} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-4">
            {isToday && (next ? (
              <div className="rounded-lg bg-primary p-6 text-white" aria-live="polite">
                <p className="opacity-90">{tr('nextDoseIn', { t: '' }).trim()}</p>
                <p className="text-h1 leading-tight">{fmtDur(next.minutes)}</p>
                <p className="font-semibold">{next.meds[0].name} {next.meds[0].strength}{next.meds.length > 1 ? ` +${next.meds.length - 1}` : ''} · {slotTime(next.slot)}</p>
              </div>
            ) : total > 0 && (
              <div className="grad-mint rounded-lg p-6 text-safe"><p className="text-h3">{tr('allDoneToday')}</p></div>
            ))}
            <MonthCalendar items={items} now={now} />
          </aside>
        </div>
      )}
    </div>
  );
}

function NowLine({ now }) {
  const { tr } = useApp();
  return (
    <li className="relative flex items-center gap-3 py-1" aria-label={`${tr('now')} ${clock(now)}`}>
      <span className="w-20 shrink-0 text-right text-small font-semibold text-danger">{clock(now)}</span>
      <span className="relative z-10 grid w-6 shrink-0 place-items-center" aria-hidden="true"><span className="size-2.5 rounded-full bg-danger" /></span>
      <span className="h-0.5 flex-1 bg-danger" aria-hidden="true" />
      <span className="text-small font-semibold text-danger">{tr('now')}</span>
    </li>
  );
}
