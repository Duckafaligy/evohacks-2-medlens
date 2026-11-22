// Safety — ported from Paper "Safety · Desktop v2" and "Safety · Desktop (all clear)".
import { useState } from 'react';
import { AlertTriangle, ChevronDown, Info, ScanLine, ShieldCheck } from 'lucide-react';
import { useApp, useCabinet, useInteractions, useNow } from '../components/ctx.js';
import { Button } from '../components/ui.jsx';
import { pl, colorFor, cleanLabel } from '../lib/app.js';
import { REDFLAGS } from '../data/redflags.js';

const SEV = {
  High: { bar: '#B4232A', soft: '#FBE9E9', label: 'high' },
  Moderate: { bar: '#A14A06', soft: '#FDF0E1', label: 'moderate' },
  Low: { bar: '#0E6A80', soft: '#E2F2F5', label: 'low' },
};
const CARD = 'rounded-lg border border-line bg-surface';

const splitFirst = (s) => {
  const m = (s || '').match(/^(.+?[.!?。])\s*(.*)$/s);
  return m ? [m[1], m[2]] : [s, ''];
};

function Chip({ name, color }) {
  return (
    <span className="flex items-center gap-2 rounded-sm border border-line bg-canvas px-2.5 py-1 text-[15px] font-semibold leading-[18px]">
      <span className="size-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />{name}
    </span>
  );
}

function InteractionCard({ x, items }) {
  const { tr, lang } = useApp();
  const s = SEV[x.severity];
  const med = (n) => items.find((i) => i.name === n);
  const [title, body] = x.plain ? splitFirst(pl(x.plain, lang)) : [tr('labelMention'), ''];
  return (
    <article className="warn-in flex flex-col gap-3.5 rounded-lg border border-line bg-surface px-6 py-[22px]" style={{ borderLeft: `6px solid ${s.bar}` }}>
      <div className="flex flex-wrap items-center gap-2.5">
        <Chip name={`${x.a} ${med(x.a)?.strength || ''}`} color={colorFor(items, med(x.a)?.id)} />
        <span className="text-[18px] font-semibold leading-[22px] text-ink-2" aria-hidden="true">+</span>
        <Chip name={`${x.b} ${med(x.b)?.strength || ''}`} color={colorFor(items, med(x.b)?.id)} />
        <span className="flex-1" />
        <span className="rounded-sm px-2.5 py-1 text-[13px] font-semibold leading-4" style={{ background: s.soft, color: s.bar }}>{tr(s.label)}</span>
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-[22px] font-semibold leading-7 tracking-[-0.01em]">{title}</h2>
        {body && <p className="max-w-[65ch] text-[16px] leading-[22px] text-ink-2">{body}</p>}
      </div>
      {x.severity !== 'Low' && (
        <div className="flex flex-col gap-2 border-t pt-3.5" style={{ borderColor: '#EBEFF4' }}>
          <p className="text-[15px] font-semibold leading-[18px]">{tr('whatToDo')}</p>
          <p className="text-[15px] leading-5">✓ {tr(x.severity === 'High' ? 'actHigh' : 'actModerate')}</p>
        </div>
      )}
      {x.excerpt && (
        <details className="text-[14px] leading-[18px] text-ink-2">
          <summary className="flex cursor-pointer list-none items-center gap-1">{tr('viewRaw')}<ChevronDown className="size-3.5" aria-hidden="true" /></summary>
          <blockquote className="mt-2 border-l-2 border-line pl-3">{x.excerpt}</blockquote>
        </details>
      )}
    </article>
  );
}

function Urgent({ items }) {
  const { tr, lang } = useApp();
  const meds = items.filter((m, i, a) => REDFLAGS[m.generic] && a.findIndex((n) => n.generic === m.generic) === i);
  return (
    <aside className="w-full shrink-0 overflow-hidden rounded-lg border border-line bg-surface lg:w-[400px]" aria-labelledby="urgent-h">
      <div className="flex items-center gap-2.5 bg-danger px-5 py-3.5 text-white">
        <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
        <h2 id="urgent-h" className="text-[17px] font-semibold leading-[22px]">{tr('callDoctorNow')}</h2>
      </div>
      <ul className="flex flex-col px-5 pb-2.5 pt-1.5">
        {meds.map((m) => (
          <li key={m.id} className="border-b py-3 text-[16px] leading-[22px]" style={{ borderColor: '#EBEFF4' }}>
            <span className="font-semibold">{m.name}:</span> {REDFLAGS[m.generic][lang]}
          </li>
        ))}
        <li className="flex items-center justify-between gap-3 py-3 text-[16px] leading-[22px]">
          <span>{tr('emergencyBar')}</span>
          <a href="tel:911" className="shrink-0 font-semibold text-danger underline">{tr('call911')}</a>
        </li>
      </ul>
    </aside>
  );
}

function LabelCard({ m }) {
  const { tr, lang } = useApp();
  const [more, setMore] = useState(false);
  const r = m.recap;
  const purpose = pl(m.purpose, lang) || splitFirst(cleanLabel(r?.purpose))[0];
  const text = cleanLabel(r ? (r.boxedWarning || r.warnings) : '');
  const src = r?.source === 'openfda' ? 'fdaLabel' : r?.source === 'snapshot' ? 'sourceSaved' : null;
  return (
    <article className={`${CARD} flex flex-col gap-2.5 px-[22px] py-5`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[18px] font-semibold leading-[22px]">{m.name} {m.strength}</h3>
        {src && <span className="shrink-0 rounded-sm bg-info-soft px-2 py-0.5 text-[12px] font-semibold leading-4 text-info">{tr(src)}</span>}
      </div>
      {purpose && <p className="text-[16px] font-semibold leading-[22px]">{purpose}</p>}
      <p className={`max-w-[65ch] text-[15px] leading-[22px] text-ink-2 ${more ? '' : 'line-clamp-4'}`}>{text || (r ? tr('noLabelText') : tr('checking'))}</p>
      {text && (
        <div className="flex items-center justify-between gap-3 pt-1 text-[14px] leading-[18px]">
          <button type="button" onClick={() => setMore(!more)} aria-expanded={more} className="font-semibold text-primary hover:underline">{tr(more ? 'readLess' : 'readMore')}</button>
          <details className="text-right text-ink-2">
            <summary className="inline-flex cursor-pointer list-none items-center gap-1">{tr('viewRaw')}<ChevronDown className="size-3.5" aria-hidden="true" /></summary>
            <p className="mt-2 text-left font-mono text-[12px] leading-[18px]">{r.boxedWarning || r.warnings}</p>
          </details>
        </div>
      )}
    </article>
  );
}

function AllClear({ items, res }) {
  const { tr, go } = useApp();
  const [n, setN] = useState(0);
  const tips = [tr('tipVitamins')];
  if (items.some((m) => m.generic === 'atorvastatin')) tips.push(tr('tipGrapefruit'));
  if (items.some((m) => m.generic === 'warfarin')) tips.push(tr('tipVitaminK'));
  tips.push(tr('tipRecheck'));
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_420px]">
      <section key={n} className="pop rounded-lg border border-line bg-surface p-9" style={{ borderLeft: '6px solid #12704F' }} aria-labelledby="clear-h">
        <span className="grid size-16 place-items-center rounded-md bg-safe-soft text-safe" aria-hidden="true"><ShieldCheck className="size-7" /></span>
        <h2 id="clear-h" className="mt-6 text-[32px] font-semibold leading-10 tracking-[-0.02em]">{tr('noKnown')}</h2>
        <p className="mt-2 text-lead text-ink-2">{tr('noKnownBody')}</p>
        <div className="mt-6 flex flex-wrap items-center gap-2.5">
          {items.map((m, i) => (
            <span key={m.id} className="flex items-center gap-2.5">
              {i > 0 && <span className="font-semibold text-ink-2" aria-hidden="true">+</span>}
              <Chip name={`${m.name} ${m.strength}`} color={colorFor(items, m.id)} />
            </span>
          ))}
          <span className="flex items-center gap-1.5 rounded-sm bg-safe-soft px-2.5 py-1 text-[13px] font-semibold text-safe"><span className="size-1.5 rounded-full bg-safe" />{tr('clear')}</span>
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button onClick={() => go('scan')}>{tr('addAnother')}</Button>
          <Button variant="secondary" onClick={() => setN(n + 1)}>{tr('checkAgain')}</Button>
        </div>
      </section>
      <aside className={`${CARD} p-6`} aria-labelledby="tips-h">
        <h2 id="tips-h" className="text-h3">{tr('goodToKnow')}</h2>
        <ul className="mt-3 space-y-3">
          {tips.map((t) => <li key={t} className="flex gap-3 leading-snug"><Info className="mt-0.5 size-4 shrink-0 text-info" aria-hidden="true" />{t}</li>)}
        </ul>
        <p className="mt-4 text-small text-ink-2">{res.interactions.length === 0 ? tr('checkedToday') : ''}</p>
      </aside>
    </div>
  );
}

export default function Safety() {
  const { tr, lang, go } = useApp();
  const { items } = useCabinet();
  const res = useInteractions(items);
  const high = res?.interactions.filter((x) => x.severity === 'High').length || 0;
  const live = items.some((m) => m.recap?.source === 'openfda');
  const now = useNow(60000);
  const date = now.toLocaleDateString(lang === 'zh' ? 'zh-CN' : lang, { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[32px] font-semibold leading-10 tracking-[-0.025em] sm:text-[40px] sm:leading-[46px]">{tr('safetyCheck')}</h1>
          {res && items.length > 0 && (
            <p className="text-[17px] leading-6 text-ink-2">
              {tr('medsPairs', { n: res.checkedCount, p: res.pairCount })}{high ? ` ${tr('needsCall', { n: high })}` : ''}
            </p>
          )}
        </div>
        {items.length > 0 && (
          <p className="flex items-center gap-2 text-[14px] leading-[18px] text-ink-2">
            <ShieldCheck className="size-[18px] text-safe" aria-hidden="true" />
            {live ? tr('checkedOn', { d: date }) : tr('savedCopyOn')}
          </p>
        )}
      </header>

      {items.length === 0 ? (
        <div className={`${CARD} p-8`}>
          <p className="text-lead">{tr('safetyEmpty')}</p>
          <Button className="mt-5" onClick={() => go('scan')}><ScanLine className="size-5" aria-hidden="true" />{tr('navScan')}</Button>
        </div>
      ) : !res ? (
        <p className="text-ink-2" role="status">{tr('checking')}</p>
      ) : res.interactions.length === 0 ? (
        <AllClear items={items} res={res} />
      ) : (
        <div className="flex flex-col items-start gap-6 lg:flex-row">
          <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
            {res.interactions.map((x) => <InteractionCard key={x.a + x.b} x={x} items={items} />)}
          </div>
          <Urgent items={items} />
        </div>
      )}

      {items.length > 0 && res && (
        <section className="flex flex-col gap-3.5" aria-labelledby="labels-h">
          <h2 id="labels-h" className="text-[22px] font-semibold leading-7">{tr('labelsSay')}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {items.map((m) => <LabelCard key={m.id} m={m} />)}
          </div>
        </section>
      )}
    </div>
  );
}
