import { useState } from 'react';
import { ArrowRight, CalendarPlus, Printer, ScanLine } from 'lucide-react';
import { useApp, useCabinet } from '../components/ctx.js';
import { Button, Chip } from '../components/ui.jsx';
import { highlightTerms } from '../lib/parse.js';
import { fkGrade } from '../lib/readability.js';
import { downloadIcs } from '../lib/ics.js';
import { pl } from '../lib/app.js';
import { EMERGENCY_NOTE } from '../data/redflags.js';

const TONE = { condition: 'bg-caution-soft text-caution', 'drug-class': 'bg-danger-soft text-danger' };

export default function Translate() {
  const { tr, lang, raw, go, openFridge } = useApp();
  const { items } = useCabinet();
  const [active, setActive] = useState(null);
  const lines = (raw || '').split(/\r?\n/).filter((l) => l.trim());

  if (!lines.length && !items.length) {
    return (
      <div className="space-y-6">
        <h1 className="text-h2 md:text-h1">{tr('translateTitle')}</h1>
        <div className="grad-calm rounded-lg p-8">
          <p className="text-lead">{tr('translateEmpty')}</p>
          <Button className="mt-5" onClick={() => go('scan')}><ScanLine className="size-5" aria-hidden="true" />{tr('navScan')}</Button>
        </div>
      </div>
    );
  }

  const segLines = lines.map((l) => highlightTerms(l));
  const terms = [...new Map(segLines.flat().filter((s) => s.term).map((s) => [s.term.term, s.term])).values()];
  const before = fkGrade(raw || '');
  const plainText = items.map((i) => pl(i.plain, 'en')).join(' ');
  const after = plainText ? Math.max(1, fkGrade(plainText)) : 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-small font-semibold text-ink-2">{tr('translateEyebrow')}</p>
          <h1 className="text-h2 md:text-h1">{tr('translateTitle')}</h1>
        </div>
        {raw && plainText && (
          <div className="rounded-md border border-line bg-surface px-4 py-3" aria-label={tr('readability')}>
            <p className="text-small text-ink-2">{tr('readability')}</p>
            <div className="mt-1 flex items-center gap-2">
              <Chip tone="caution">{tr('gradeBefore', { n: before })}</Chip>
              <ArrowRight className="size-4" aria-hidden="true" />
              <Chip tone="safe">{tr('gradeAfter', { n: after })}</Chip>
            </div>
            <div className="mt-2 grid gap-1" aria-hidden="true">
              <div className="h-1.5 rounded-sm bg-caution-soft"><div className="meter-fill h-full rounded-sm bg-caution" style={{ width: `${Math.min(100, (before / 18) * 100)}%` }} /></div>
              <div className="h-1.5 rounded-sm bg-safe-soft"><div className="meter-fill h-full rounded-sm bg-safe" style={{ width: `${Math.min(100, (after / 18) * 100)}%` }} /></div>
            </div>
          </div>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-line bg-surface p-6" aria-labelledby="raw-h">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="raw-h" className="text-lead font-semibold">{tr('doctorWrote')}</h2>
            <span className="text-small font-semibold text-primary">{tr('termsHighlighted', { n: terms.length })}</span>
          </div>
          {lines.length > 0 ? (
            <ol className="mt-4 space-y-3 rounded-md bg-canvas p-4 font-mono text-[15px] leading-relaxed">
              {segLines.map((segs, n) => (
                <li key={n} className="flex gap-3"><span className="text-ink-2" aria-hidden="true">{n + 1}.</span>
                  <span>{segs.map((s, k) => s.term ? (
                    <button key={k} type="button" onClick={() => setActive(s.term)} aria-label={`${s.text}: ${pl(s.term.plain, lang)}`}
                      className={`rounded-sm px-0.5 underline decoration-dotted underline-offset-4 ${active?.term === s.term.term ? 'bg-primary text-white' : TONE[s.term.category] || 'bg-primary-soft text-primary'}`}>
                      {s.text}
                    </button>
                  ) : <span key={k}>{s.text}</span>)}</span>
                </li>
              ))}
            </ol>
          ) : <p className="mt-4 text-ink-2">{tr('translateEmpty')}</p>}

          {active && (
            <div className="pop mt-4 rounded-md border-2 border-primary bg-primary-soft p-4" role="status" aria-live="polite">
              <p className="text-lead font-semibold text-primary">{active.term} · {pl(active.plain, lang)}</p>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {terms.map((g) => (
              <button key={g.term} type="button" onClick={() => setActive(g)}
                className={`rounded-sm px-2 py-1 font-mono text-[14px] ${TONE[g.category] || 'bg-primary-soft text-primary'}`}>
                {g.term} = {pl(g.plain, lang).split(/[(,;]/)[0].trim()}
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col rounded-lg border border-line bg-surface p-6" aria-labelledby="plain-h">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="plain-h" className="text-lead font-semibold">{tr('carePlan')}</h2>
            {after > 0 && <Chip tone="safe">{tr('gradeLevel', { n: Math.round(after) })}</Chip>}
          </div>
          <div className="mt-4 flex-1 space-y-3">
            {items.map((m, i) => (
              <article key={m.id} className="rise rounded-md bg-canvas p-4" style={{ '--i': i }}>
                <h3 className="font-semibold">{m.name} {m.strength}{m.purpose ? ` — ${pl(m.purpose, lang)}` : ''}</h3>
                <p className="mt-1 text-ink-2">{pl(m.plain, lang)}</p>
              </article>
            ))}
            <div className="rounded-md border border-danger/30 bg-danger-soft p-4">
              <p className="font-semibold text-danger">{tr('getHelp')}</p>
              <p className="mt-1">{EMERGENCY_NOTE[lang]}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button onClick={openFridge}><Printer className="size-5" aria-hidden="true" />{tr('printCard')}</Button>
            <Button variant="secondary" disabled={!items.length} onClick={() => downloadIcs(items, { lang })}><CalendarPlus className="size-5" aria-hidden="true" />{tr('exportIcs')}</Button>
          </div>
        </section>
      </div>
    </div>
  );
}
