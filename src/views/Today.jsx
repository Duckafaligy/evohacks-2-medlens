import { Sunrise, Sun, Sunset, Moon, AlertTriangle, ArrowRight, Check, CircleCheck, Printer, ScanLine } from 'lucide-react';
import { useApp, useCabinet, useInteractions, useNow } from '../components/ctx.js';
import { Button, Chip, FoodChips, ProgressBar } from '../components/ui.jsx';
import * as cabinet from '../lib/cabinet.js';
import { SLOTS, slotTime, nextDose, localDay } from '../lib/app.js';
import { SCENARIOS } from '../data/scenarios.js';

const ICON = { morning: Sunrise, noon: Sun, evening: Sunset, bedtime: Moon };

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

function SlotCard({ slot, meds, taken, day, i }) {
  const { tr } = useApp();
  const Icon = ICON[slot];
  const done = meds.length > 0 && meds.every((m) => taken.some((t) => t.id === m.id && t.slot === slot));
  const toggle = () => meds.forEach((m) => cabinet.markTaken(m.id, day, slot, !done));
  return (
    <section className="rise flex flex-col rounded-md border border-line bg-surface p-5" style={{ '--i': i }} aria-labelledby={`slot-${slot}`}>
      <h3 id={`slot-${slot}`} className="flex items-center gap-2 text-h3">
        <Icon className="size-5 text-caution" aria-hidden="true" />{tr(slot)}
      </h3>
      <p className="text-small text-ink-2">{slotTime(slot)} · {tr('nPills', { n: meds.length })}</p>
      <div className="mt-4 flex flex-1 flex-col gap-3">
        {meds.length === 0 ? (
          <div className="flex flex-1 flex-col justify-center rounded-md bg-canvas p-4">
            <CircleCheck className="mb-2 size-6 text-safe" aria-hidden="true" />
            <p className="font-semibold">{tr('nothingToTake')}</p>
            <p className="text-small text-ink-2">{tr('freeSlot')}</p>
          </div>
        ) : meds.map((m) => (
          <div key={m.id} className="rounded-md bg-canvas p-3">
            <p className="font-semibold">{m.name} {m.strength}</p>
            <div className="mt-1.5"><FoodChips med={m} /></div>
          </div>
        ))}
      </div>
      {meds.length > 0 && (
        done ? (
          <button type="button" onClick={toggle} aria-pressed="true" className="btn mt-4 flex items-center justify-center gap-2 rounded-md bg-safe-soft font-semibold text-safe">
            <Check className="size-5" aria-hidden="true" />{tr('taken')}
          </button>
        ) : (
          <button type="button" onClick={toggle} aria-pressed="false" className="btn mt-4 flex items-center justify-center gap-3 rounded-md border border-control bg-surface font-semibold hover:bg-canvas">
            <span className="size-5 rounded-sm border-2 border-ink-2" aria-hidden="true" />{tr('didYouTake')}
          </button>
        )
      )}
    </section>
  );
}

export default function Today() {
  const { tr, lang, go, openFridge } = useApp();
  const { items } = useCabinet();
  const now = useNow();
  const day = localDay(now);
  const taken = cabinet.takenOn(day);
  const inter = useInteractions(items);
  const high = inter?.interactions.filter((x) => x.severity === 'High') || [];

  const total = SLOTS.reduce((n, s) => n + items.filter((i) => i.slots?.includes(s)).length, 0);
  const doneCount = taken.filter((t) => items.some((i) => i.id === t.id && i.slots?.includes(t.slot))).length;
  const next = nextDose(items, taken, now);
  const hour = now.getHours();
  const greet = hour < 12 ? 'goodMorning' : hour < 18 ? 'goodAfternoon' : 'goodEvening';
  const prn = items.filter((i) => i.prn);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-body text-ink-2">{now.toLocaleDateString(lang === 'zh' ? 'zh-CN' : lang, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
          <h1 className="text-h2 md:text-h1">{tr(greet)}</h1>
          {total > 0 && (
            <div className="mt-3 flex max-w-md items-center gap-4">
              <ProgressBar value={doneCount / total} tone="safe" label={tr('dosesTaken', { n: doneCount, total })} className="max-w-56" />
              <span className="shrink-0 font-semibold">{tr('dosesTaken', { n: doneCount, total })}</span>
            </div>
          )}
        </div>
        {items.length > 0 && (
          next ? (
            <div className="rounded-lg bg-primary px-6 py-5 text-white" aria-live="polite">
              <p className="text-small opacity-90">{tr('nextDose')}</p>
              <p className="text-h2 leading-tight">{Math.floor(next.minutes / 60)}h {next.minutes % 60}m</p>
              <p className="font-semibold">{next.meds[0].name} {next.meds[0].strength}{next.meds.length > 1 ? ` +${next.meds.length - 1}` : ''} · {slotTime(next.slot)}</p>
            </div>
          ) : (
            <div className="rounded-lg bg-safe-soft px-6 py-5 text-safe">
              <p className="text-small">{tr('nextDose')}</p>
              <p className="text-h3">{tr('allDoneToday')}</p>
            </div>
          )
        )}
      </header>

      {high.map((x) => (
        <div key={x.a + x.b} role="alert" className="warn-in flex flex-wrap items-center gap-3 rounded-md border border-danger/30 bg-danger-soft px-5 py-3">
          <AlertTriangle className="size-5 text-danger" aria-hidden="true" />
          <Chip tone="solidDanger">{tr('high')}</Chip>
          <span className="flex-1 font-semibold">{x.a} + {x.b}</span>
          <span className="text-small text-ink-2">{tr('askPharmacist')}</span>
          <a href="#/app/safety" className="flex items-center gap-1 font-semibold text-primary hover:underline">{tr('details')}<ArrowRight className="size-4" aria-hidden="true" /></a>
        </div>
      ))}

      {items.length === 0 ? <Empty /> : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-h3">{tr('todaysPills')}</h2>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => go('scan')}><ScanLine className="size-5" aria-hidden="true" />{tr('addMedicine')}</Button>
              <Button variant="secondary" onClick={openFridge}><Printer className="size-5" aria-hidden="true" />{tr('printCard')}</Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {SLOTS.map((slot, i) => (
              <SlotCard key={slot} slot={slot} i={i} day={day} taken={taken} meds={items.filter((m) => m.slots?.includes(slot))} />
            ))}
          </div>
          {prn.length > 0 && (
            <section aria-labelledby="prn-h">
              <h2 id="prn-h" className="mb-3 text-h3">{tr('asNeeded')}</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {prn.map((m) => (
                  <div key={m.id} className="rounded-md border border-line bg-surface p-4">
                    <p className="font-semibold">{m.name} {m.strength}</p>
                    <div className="mt-1.5"><FoodChips med={m} /></div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
