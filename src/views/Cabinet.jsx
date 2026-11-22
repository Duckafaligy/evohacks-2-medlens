// My medicines — ported from Paper "My medicines · Desktop".
import { useState } from 'react';
import { AlertTriangle, Pill, RotateCw, ScanLine, ShieldCheck, Trash2, X } from 'lucide-react';
import { useApp, useCabinet } from '../components/ctx.js';
import { Button } from '../components/ui.jsx';
import * as cabinet from '../lib/cabinet.js';
import { pl, colorFor, softFor, activeOn, localDay, cleanLabel } from '../lib/app.js';

const SOON_DAYS = 7;
const fmt = (iso, locale) => (iso ? new Date(iso.length === 10 ? `${iso}T12:00` : iso).toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' }) : '—');
const daysUntil = (iso) => (iso ? Math.round((new Date(`${iso}T12:00`) - new Date()) / 864e5) : Infinity);
const sentences = (t) => (t || '').split(/(?<=[.!?])\s+/).filter((s) => s.length > 3);

function schedule(m, tr) {
  const when = m.prn ? tr('asNeeded') : (m.slots || []).map((s) => tr(s)).join(' + ');
  const food = ({ with: tr('withFood'), before: tr('beforeFood'), without: tr('emptyStomach') })[m.withFood];
  return [when, food && food.toLowerCase()].filter(Boolean).join(', ');
}

function MedCard({ m, items, selected, onOpen }) {
  const { tr, lang } = useApp();
  const locale = lang === 'zh' ? 'zh-CN' : lang;
  const c = colorFor(items, m.id);
  const total = m.supply || (m.pillsLeft != null ? Math.max(m.pillsLeft, (m.perDay || 1) * 30) : null);
  const soon = daysUntil(m.refillDate) <= SOON_DAYS;
  return (
    <button type="button" onClick={onOpen} aria-pressed={selected}
      className="flex w-full flex-col gap-4 rounded-lg border bg-surface p-5 text-left transition-shadow hover:shadow-md sm:w-[318px]"
      style={{ borderColor: selected ? '#1849A9' : '#DCE2EA', boxShadow: selected ? '0 0 0 1px #1849A9' : undefined }}>
      <span className="flex items-start gap-3.5">
        <span className="grid size-11 shrink-0 place-items-center rounded-md" style={{ background: softFor(c), color: c }} aria-hidden="true"><Pill className="size-[22px]" /></span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[19px] font-semibold leading-6">{m.name.split(' (')[0]} <span className="font-normal text-ink-2">{m.strength}</span></span>
          <span className="text-[15px] leading-5 text-ink-2">{schedule(m, tr)}</span>
        </span>
      </span>
      {m.pillsLeft != null && (
        <span className="flex flex-col gap-2">
          <span className="flex items-baseline justify-between">
            <span className="text-[15px] font-semibold leading-[34px]"><span className="text-[30px] tracking-[-0.02em]">{m.pillsLeft}</span> {tr('pillsLeftShort')}</span>
            {total && <span className="text-[14px] leading-[18px] text-ink-2">{tr('ofN', { n: total })}</span>}
          </span>
          {total && (
            <span className="block h-1.5 rounded-[3px]" style={{ background: '#E9EDF2' }} aria-hidden="true">
              <span className="block h-1.5 rounded-[3px]" style={{ width: `${Math.min(100, (m.pillsLeft / total) * 100)}%`, background: soon ? '#A14A06' : c }} />
            </span>
          )}
        </span>
      )}
      <span className="flex items-center justify-between border-t pt-3 text-[13px] leading-4 text-ink-2" style={{ borderColor: '#EBEFF4' }}>
        {m.refillDate ? (
          <span className={`flex items-center gap-1.5 ${soon ? 'font-semibold text-caution' : ''}`}>
            <RotateCw className="size-3.5" aria-hidden="true" />{soon ? tr('refillSoon') : `${tr('refill')} ${fmt(m.refillDate, locale)}`}
          </span>
        ) : <span>{m.prn ? tr('asNeeded') : ''}</span>}
        <span>{tr('scanned')} {fmt(m.scannedAt, locale)}</span>
      </span>
    </button>
  );
}

function Drawer({ m, items, onClose }) {
  const { tr, lang } = useApp();
  const c = colorFor(items, m.id);
  const r = m.recap;
  const warnings = sentences(cleanLabel(r?.boxedWarning || r?.warnings)).slice(0, 2);
  const rows = [
    // Label "ingredient" fields can be whole inactive-ingredient lists; fall back to the generic name.
    ['activeIngredients', r?.activeIngredients && r.activeIngredients.length < 60 ? cleanLabel(r.activeIngredients) : m.generic && m.generic[0].toUpperCase() + m.generic.slice(1), true],
    ['purpose', pl(m.purpose, lang) || r?.purpose],
    ['howToTake', pl(m.plain, lang) || r?.howToTake],
  ].filter(([, v]) => v);
  return (
    <aside className="pop flex w-full shrink-0 flex-col self-start rounded-lg border border-line bg-surface shadow-[0_12px_32px_#0F1B2D1A] lg:w-[420px]" aria-label={`${m.name} ${m.strength}`}>
      <div className="flex items-start gap-3.5 border-b px-[22px] pb-[18px] pt-[22px]" style={{ borderColor: '#EBEFF4' }}>
        <span className="grid size-11 shrink-0 place-items-center rounded-md" style={{ background: softFor(c), color: c }} aria-hidden="true"><Pill className="size-[22px]" /></span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="text-[22px] font-semibold leading-7 tracking-[-0.01em]">{m.name} {m.strength}</h2>
          {r && r.source !== 'none' && (
            <span className="flex w-fit items-center gap-1.5 rounded-sm bg-info-soft px-2 py-0.5 text-[12px] font-semibold leading-4 text-info">
              <ShieldCheck className="size-3" strokeWidth={2.4} aria-hidden="true" />{tr(r.source === 'openfda' ? 'fdaLabel' : 'sourceSaved')}
            </span>
          )}
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="grid size-8 shrink-0 place-items-center rounded-[8px] border border-line hover:bg-canvas"><X className="size-3.5" /></button>
      </div>
      <div className="flex flex-col px-[22px] pb-[22px] pt-1.5">
        {rows.map(([k, v, strong]) => (
          <div key={k} className="flex flex-col gap-1 border-b py-3.5" style={{ borderColor: '#EBEFF4' }}>
            <p className="text-[13px] leading-4 text-ink-2">{tr(k)}</p>
            <p className={`max-w-[65ch] text-[16px] leading-[22px] ${strong ? 'font-semibold' : ''}`}>{v}</p>
          </div>
        ))}
        {warnings.length > 0 && (
          <div className="flex flex-col gap-2 border-b py-3.5" style={{ borderColor: '#EBEFF4' }}>
            <p className="text-[13px] leading-4 text-ink-2">{tr('warnings')}</p>
            {warnings.map((w) => (
              <p key={w} className="flex items-start gap-2.5 text-[15px] leading-5"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-caution" aria-hidden="true" />{w}</p>
            ))}
          </div>
        )}
        {r?.sideEffects && (
          <div className="flex flex-col gap-2 py-3.5">
            <p className="text-[13px] leading-4 text-ink-2">{tr('sideEffects')}</p>
            <p className="line-clamp-4 text-[15px] leading-5">{cleanLabel(r.sideEffects)}</p>
          </div>
        )}
        <p className="pt-1.5 text-[13px] leading-4 text-ink-2">{r ? tr('sourceLine') : tr('checking')}</p>
        <Button variant="danger" className="mt-5 w-fit" onClick={() => { cabinet.remove(m.id); onClose(); }}>
          <Trash2 className="size-4" aria-hidden="true" />{tr('remove')}
        </Button>
      </div>
    </aside>
  );
}

export default function Cabinet() {
  const { tr, go } = useApp();
  const { items } = useCabinet();
  const [tab, setTab] = useState('active');
  const [openId, setOpenId] = useState(null);
  const today = localDay();
  const q = decodeURIComponent(window.location.hash.split('?q=')[1] || '').toLowerCase();
  const isPast = (m) => m.days && !activeOn(m, today);
  const shown = items.filter((m) => (tab === 'past' ? isPast(m) : !isPast(m)))
    .filter((m) => !q || `${m.name} ${m.generic}`.toLowerCase().includes(q));
  const soon = items.filter((m) => !isPast(m) && daysUntil(m.refillDate) <= SOON_DAYS).length;
  const open = items.find((i) => i.id === openId);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[40px] font-semibold leading-[46px] tracking-[-0.025em]">{tr('navCabinetTitle')}</h1>
          <p className="text-[17px] leading-[22px] text-ink-2">{tr('nMeds', { n: items.length })}{soon ? ` · ${tr('nRefillSoon', { n: soon })}` : ''}</p>
        </div>
        <div role="radiogroup" aria-label={tr('navCabinetTitle')} className="flex gap-0.5 rounded-md p-[3px]" style={{ background: '#E9EDF2' }}>
          {['active', 'past'].map((t) => (
            <button key={t} type="button" role="radio" aria-checked={tab === t} onClick={() => setTab(t)}
              className={`h-[30px] rounded-[8px] border px-3.5 text-[14px] leading-[18px] ${tab === t ? 'border-line bg-surface font-semibold text-ink' : 'border-transparent text-ink-2 hover:text-ink'}`}>
              {tr(t === 'active' ? 'activeMeds' : 'pastMeds')}
            </button>
          ))}
        </div>
      </header>

      {items.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface p-8">
          <p className="text-lead">{tr('emptyTitle')}</p>
          <Button className="mt-5" onClick={() => go('scan')}><ScanLine className="size-5" aria-hidden="true" />{tr('navScan')}</Button>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-6 lg:flex-row">
          <div className="flex min-w-0 flex-1 flex-wrap gap-4">
            {shown.length === 0 && <p className="text-ink-2">{tr('noneHere')}</p>}
            {shown.map((m) => <MedCard key={m.id} m={m} items={items} selected={m.id === openId} onOpen={() => setOpenId(m.id === openId ? null : m.id)} />)}
          </div>
          {open && <Drawer key={open.id} m={open} items={items} onClose={() => setOpenId(null)} />}
        </div>
      )}
    </div>
  );
}
