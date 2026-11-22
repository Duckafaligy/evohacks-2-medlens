// Translate — ported from Paper "Translate · Desktop v2".
import { useEffect, useState } from 'react';
import Quiz from './Quiz.jsx';
import { ArrowRight, Download, ScanLine } from 'lucide-react';
import { useApp, useCabinet } from '../components/ctx.js';
import { Button } from '../components/ui.jsx';
import { highlightTerms, parseLine } from '../lib/parse.js';
import { fkGrade } from '../lib/readability.js';
import { downloadIcs } from '../lib/ics.js';
import { pl, colorFor } from '../lib/app.js';

const CARD = 'rounded-lg border border-line bg-surface px-6 py-[22px]';
const lower1 = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

export default function Translate({ route }) {
  const { tr, lang, raw, go, openFridge } = useApp();
  const { items } = useCabinet();
  const lines = (raw || '').split(/\r?\n/).filter((l) => l.trim());
  // Only jargon gets highlighted: units and phrases already in plain English stay plain text.
  const plainAlready = /^(daily|nightly|with |in the|at bedtime|every|twice|once|as needed|before|after|for \d|\d+ times)/i;
  const segLines = lines.map((l) => highlightTerms(l).map((s) => (
    s.term && (s.term.category === 'unit' || plainAlready.test(s.text)) ? { text: s.text } : s)));
  const terms = [...new Map(segLines.flat().filter((s) => s.term).map((s) => [s.term.term, s.term])).values()];
  const [picked, setPicked] = useState(null);
  useEffect(() => {
    if (route === 'quiz') document.getElementById('quiz')?.scrollIntoView({ block: 'start' });
  }, [route]);
  const active = picked || terms.find((t) => t.term === 'BID') || terms[0] || null;

  if (!lines.length && !items.length) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-[40px] font-semibold leading-[46px] tracking-[-0.025em]">{tr('translateTitle')}</h1>
        <div className={CARD}>
          <p className="text-lead">{tr('translateEmpty')}</p>
          <Button className="mt-5" onClick={() => go('scan')}><ScanLine className="size-5" aria-hidden="true" />{tr('navScan')}</Button>
        </div>
      </div>
    );
  }

  const before = Math.round(fkGrade(raw || ''));
  const plainText = items.map((i) => pl(i.plain, 'en')).join(' ');
  const after = plainText ? Math.max(1, Math.round(fkGrade(plainText))) : 0;
  // Which medicine on the list uses the selected word?
  const line = active && lines.find((l) => active.match.test(l));
  const parsed = line && parseLine(line);
  const onList = parsed && items.find((i) => i.generic === parsed.generic);
  const food = onList && ({ with: tr('withFood'), before: tr('beforeFood'), without: tr('emptyStomach') })[onList.withFood];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[40px] font-semibold leading-[46px] tracking-[-0.025em]">{tr('translateTitle')}</h1>
          <p className="text-[17px] leading-[22px] text-ink-2">{tr('tapWord')}</p>
        </div>
        {raw && after > 0 && (
          <div className="flex items-center gap-2.5 rounded-md border border-line bg-surface px-3.5 py-2.5">
            <span className="text-[14px] leading-[18px] text-ink-2">{tr('readability')}</span>
            <span className="rounded-sm bg-danger-soft px-2 py-[3px] text-[14px] font-semibold leading-[18px] text-danger">{tr('gradeN', { n: before })}</span>
            <ArrowRight className="size-4 text-ink-2" aria-hidden="true" />
            <span className="rounded-sm bg-safe-soft px-2 py-[3px] text-[14px] font-semibold leading-[18px] text-safe">{tr('gradeN', { n: after })}</span>
          </div>
        )}
      </header>

      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <section className={`${CARD} flex w-full min-w-0 flex-1 flex-col gap-4`} aria-labelledby="raw-h">
          <div className="flex items-center justify-between gap-3">
            <h2 id="raw-h" className="text-[18px] font-semibold leading-6">{tr('doctorWrote')}</h2>
            <span className="text-[13px] leading-4 text-ink-2">{tr('termsFound', { n: terms.length })}</span>
          </div>
          {lines.length > 0 ? (
            <ol className="flex flex-col gap-3 rounded-md bg-canvas p-[18px] font-mono text-[14px] leading-[22px]">
              {segLines.map((segs, n) => (
                <li key={n}>
                  {n + 1}.{' '}
                  {segs.map((s, k) => s.term ? (
                    <button key={k} type="button" onClick={() => setPicked(s.term)} aria-pressed={active?.term === s.term.term}
                      className={active?.term === s.term.term
                        ? 'rounded-[4px] bg-primary px-[5px] font-bold text-white'
                        : 'font-semibold text-info underline decoration-1 underline-offset-2 hover:bg-info-soft'}>
                      {s.text}
                    </button>
                  ) : <span key={k}>{s.text}</span>)}
                </li>
              ))}
            </ol>
          ) : <p className="text-ink-2">{tr('translateEmpty')}</p>}

          {active && (
            <div key={active.term} className="pop flex flex-col gap-2 rounded-md border-2 border-primary bg-surface px-[18px] py-4" aria-live="polite">
              <p className="flex flex-wrap items-baseline gap-2.5">
                <span className="font-mono text-[16px] font-bold leading-5 text-primary">{active.term}</span>
                <span className="text-[20px] font-semibold leading-[26px]">{pl(active.plain, lang)}</span>
              </p>
              {onList && (
                <p className="flex items-center gap-2 text-[14px] leading-[18px] text-ink-2">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: colorFor(items, onList.id) }} aria-hidden="true" />
                  {tr('onYourList')}: {onList.name} {onList.strength}{food ? `, ${food.toLowerCase()}` : ''}
                </p>
              )}
            </div>
          )}
        </section>

        <section className={`${CARD} flex w-full shrink-0 flex-col gap-1.5 lg:w-[460px]`} aria-labelledby="plain-h">
          <h2 id="plain-h" className="pb-2 text-[18px] font-semibold leading-6">{tr('plainWords')}</h2>
          {items.map((m, i) => (
            <article key={m.id} className={`flex gap-3 py-3 ${i < items.length - 1 ? 'border-b' : ''}`} style={{ borderColor: '#EBEFF4' }}>
              <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: colorFor(items, m.id) }} aria-hidden="true" />
              <div className="flex min-w-0 flex-col gap-0.5">
                <h3 className="text-[16px] font-semibold leading-[22px]">{m.name} {m.strength}{m.purpose ? ` · ${lower1(pl(m.purpose, lang).split(/[:：]/)[0])}` : ''}</h3>
                <p className="max-w-[65ch] text-[15px] leading-[21px] text-ink-2">{pl(m.plain, lang)}</p>
              </div>
            </article>
          ))}
          <div className="flex gap-2.5 pt-3">
            <button type="button" onClick={openFridge} className="flex h-11 flex-1 items-center justify-center whitespace-nowrap rounded-md bg-primary px-3 text-[15px] font-semibold leading-[18px] text-white hover:bg-primary/90">
              {tr('printCard')}
            </button>
            <button type="button" disabled={!items.length} onClick={() => downloadIcs(items, { lang })}
              className="flex h-11 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-line px-3 text-[15px] font-semibold leading-[18px] hover:bg-canvas disabled:opacity-50">
              <Download className="size-[15px]" aria-hidden="true" />{tr('exportIcs')}
            </button>
          </div>
        </section>
      </div>
      <section id="quiz" className="scroll-mt-6 border-t border-line pt-8"><Quiz embedded /></section>
    </div>
  );
}
