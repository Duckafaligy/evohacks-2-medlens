import { ScanLine, ShieldCheck, Phone } from 'lucide-react';
import { useApp, useCabinet, useInteractions } from '../components/ctx.js';
import { Button, SourceBadge } from '../components/ui.jsx';
import { pl } from '../lib/app.js';
import { REDFLAGS, REDFLAG_HEADING, EMERGENCY_NOTE } from '../data/redflags.js';

const STYLE = {
  High: { box: 'border-danger/30 bg-danger-soft', chip: 'bg-danger', action: 'text-danger', label: 'highRisk', act: 'actHigh' },
  Moderate: { box: 'border-caution/30 bg-caution-soft', chip: 'bg-caution', action: 'text-caution', label: 'moderate', act: 'actModerate' },
  Low: { box: 'border-info/30 bg-info-soft', chip: 'bg-info', action: 'text-info', label: 'low', act: 'actLow' },
};

export default function Safety() {
  const { tr, lang, go } = useApp();
  const { items } = useCabinet();
  const res = useInteractions(items);
  const strength = (name) => items.find((i) => i.name === name)?.strength || '';

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-small font-semibold text-ink-2">{tr('safetyEyebrow')}</p>
          <h1 className="text-h2 md:text-h1">{tr('safetyTitle')}</h1>
        </div>
        {res && items.length > 0 && (
          <span className="rounded-md border border-safe/30 bg-safe-soft px-4 py-2 font-semibold text-safe">
            {tr('crossChecked', { n: res.checkedCount })} · {tr('pairs', { n: res.pairCount })}
          </span>
        )}
      </header>

      {items.length === 0 ? (
        <div className="grad-calm rounded-lg p-8">
          <p className="text-lead">{tr('safetyEmpty')}</p>
          <Button className="mt-5" onClick={() => go('scan')}><ScanLine className="size-5" aria-hidden="true" />{tr('navScan')}</Button>
        </div>
      ) : !res ? (
        <p className="text-ink-2" role="status">{tr('checking')}</p>
      ) : (
        <>
          <div className="space-y-3">
            {res.interactions.length === 0 && (
              <div className="grad-mint flex items-center gap-3 rounded-md border border-safe/30 p-5">
                <ShieldCheck className="size-6 text-safe" aria-hidden="true" /><p className="font-semibold">{tr('noInteractions')}</p>
              </div>
            )}
            {res.interactions.map((x, i) => {
              const s = STYLE[x.severity];
              return (
                <article key={x.a + x.b} className={`warn-in rounded-md border p-5 ${s.box}`} style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`rounded-sm px-2 py-0.5 text-small font-semibold text-white ${s.chip}`}>{tr(s.label)}</span>
                    <h2 className="flex-1 text-lead font-semibold">{x.a} {strength(x.a)} + {x.b} {strength(x.b)}</h2>
                    <span className={`text-small font-semibold ${s.action}`}>{tr(s.act)}</span>
                  </div>
                  <p className="mt-2">{x.plain ? pl(x.plain, lang) : tr('labelMention')}</p>
                  {x.excerpt && (
                    <details className="mt-2 text-small">
                      <summary className="cursor-pointer font-semibold text-ink-2">{tr('fromLabel')} ({x.labelOf}) · {x.labelSource === 'openfda' ? tr('sourceLive') : tr('sourceSaved')}</summary>
                      <blockquote className="mt-2 border-l-2 border-control pl-3 text-ink-2">{x.excerpt}</blockquote>
                    </details>
                  )}
                </article>
              );
            })}
          </div>

          <section aria-labelledby="flags-h" className="rounded-md border border-danger/30 bg-surface p-5">
            <h2 id="flags-h" className="text-h3 text-danger">{REDFLAG_HEADING[lang]}</h2>
            <ul className="mt-3 space-y-2">
              {items.filter((m, i, a) => REDFLAGS[m.generic] && a.findIndex((n) => n.generic === m.generic) === i).map((m) => (
                <li key={m.id}><strong>{m.name}:</strong> {REDFLAGS[m.generic][lang]}</li>
              ))}
            </ul>
            <p className="mt-4 flex items-center gap-2 font-semibold text-danger"><Phone className="size-5" aria-hidden="true" />{EMERGENCY_NOTE[lang]}</p>
          </section>

          <section aria-labelledby="labels-h">
            <h2 id="labels-h" className="mb-4 text-h3">{tr('labelSummaries')}</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((m, i) => (
                <article key={m.id} className="rise rounded-lg border border-line bg-surface p-5" style={{ '--i': i }}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lead font-semibold">{m.name} {m.strength}</h3>
                    {m.recap && <SourceBadge source={m.recap.source} />}
                  </div>
                  <p className="mt-2 text-small text-ink-2">{m.recap ? (m.recap.warnings || tr('noLabelText')) : tr('checking')}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
