import { useState } from 'react';
import { Pill, Trash2, ScanLine } from 'lucide-react';
import { useApp, useCabinet } from '../components/ctx.js';
import { Button, Chip, Drawer, FoodChips, SourceBadge } from '../components/ui.jsx';
import * as cabinet from '../lib/cabinet.js';
import { pl } from '../lib/app.js';

const fmtDate = (iso, lang) => (iso ? new Date(iso.length === 10 ? `${iso}T12:00` : iso).toLocaleDateString(lang === 'zh' ? 'zh-CN' : lang, { month: 'short', day: 'numeric' }) : '—');

function Recap({ med }) {
  const { tr, lang } = useApp();
  const r = med.recap;
  const rows = [
    ['activeIngredients', r?.activeIngredients],
    ['purpose', r?.purpose || pl(med.purpose, lang)],
    ['howToTake', pl(med.plain, lang) || r?.howToTake],
    ['warnings', r?.warnings],
    ['sideEffects', r?.sideEffects],
  ];
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {r ? <SourceBadge source={r.source} /> : <Chip>{tr('checking')}</Chip>}
        <span className="text-small text-ink-2">{tr('scanned')} {fmtDate(med.scannedAt, lang)}</span>
      </div>
      <FoodChips med={med} />
      <dl className="space-y-4">
        {rows.filter(([, v]) => v).map(([k, v]) => (
          <div key={k}>
            <dt className="text-small font-semibold text-ink-2">{tr(k)}</dt>
            <dd className="mt-1">{v}</dd>
          </div>
        ))}
      </dl>
      {r?.source && r.source !== 'none' && <p className="text-small text-ink-2">{tr('labelNote')}</p>}
    </div>
  );
}

export default function Cabinet() {
  const { tr, lang, go } = useApp();
  const { items } = useCabinet();
  const [openId, setOpenId] = useState(null);
  const open = items.find((i) => i.id === openId);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-h2 md:text-h1">{tr('navCabinet')}</h1>
        <Button variant="secondary" onClick={() => go('scan')}><ScanLine className="size-5" aria-hidden="true" />{tr('addMedicine')}</Button>
      </header>
      {items.length === 0 ? (
        <div className="grad-calm rounded-lg p-8"><p className="text-lead">{tr('emptyTitle')}</p></div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((m, i) => (
            <li key={m.id} className="rise" style={{ '--i': i }}>
              <button type="button" onClick={() => setOpenId(m.id)}
                className="flex h-full w-full flex-col gap-3 rounded-lg border border-line bg-surface p-5 text-left transition-shadow hover:shadow-md">
                <span className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-md bg-primary-soft text-primary" aria-hidden="true"><Pill className="size-5" /></span>
                  <span className="text-lead font-semibold">{m.name}</span>
                </span>
                <span className="text-ink-2">{m.strength}</span>
                <span className="mt-auto grid grid-cols-2 gap-2 text-small">
                  <span><span className="block text-ink-2">{tr('pillsLeft')}</span><span className="font-semibold">{m.pillsLeft ?? '—'}</span></span>
                  <span><span className="block text-ink-2">{tr('refillBy')}</span><span className="font-semibold">{fmtDate(m.refillDate, lang)}</span></span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open ? `${open.name} ${open.strength}` : ''}>
        {open && (
          <>
            <Recap med={open} />
            <Button variant="danger" className="mt-8" onClick={() => { cabinet.remove(open.id); setOpenId(null); }}>
              <Trash2 className="size-5" aria-hidden="true" />{tr('remove')}
            </Button>
          </>
        )}
      </Drawer>
    </div>
  );
}
