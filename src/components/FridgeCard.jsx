import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, ScanSearch } from 'lucide-react';
import { useApp, useCabinet } from './ctx.js';
import { Button, Modal } from './ui.jsx';
import { SLOTS, slotTime, planOf, pl } from '../lib/app.js';
import { shareUrl } from '../lib/share.js';
import { REDFLAGS, REDFLAG_HEADING } from '../data/redflags.js';

const note = (m, tr) => [
  ({ with: tr('withFood'), without: tr('emptyStomach'), before: tr('beforeFood') })[m.withFood],
  m.water && tr('fullGlassWater'),
].filter(Boolean).join(', ').toLowerCase();

const Box = () => <span className="mt-1 size-5 shrink-0 rounded-sm border-2 border-black" aria-hidden="true" />;

export default function FridgeCard({ open, onClose }) {
  const { tr, lang } = useApp();
  const { items } = useCabinet();
  const url = typeof window !== 'undefined' ? shareUrl(planOf(items)) : '';
  const flags = [...new Set(items.map((i) => i.generic))].filter((g) => REDFLAGS[g]);
  const prn = items.filter((i) => i.prn);
  const [printedOn] = useState(() => new Date());
  const locale = lang === 'zh' ? 'zh-CN' : lang;

  return (
    <Modal open={open} onClose={onClose} title={tr('printCard')} wide>
      <article className="print-card bg-white p-2 text-black" aria-label={tr('fridgeTitle')}>
        <header className="flex items-end justify-between gap-4 border-b-4 border-black pb-3">
          <div>
            <h2 className="text-h1 leading-tight">{tr('fridgeTitle')}</h2>
            <p className="text-body text-[#46536A]">{tr('updatedOn', { d: printedOn.toLocaleDateString(locale, { dateStyle: 'medium' }) })}</p>
          </div>
          <span className="flex items-center gap-2 text-lead font-semibold">
            <span className="grid size-8 place-items-center rounded-md bg-[#1849A9] text-white" aria-hidden="true"><ScanSearch className="size-4" /></span>MedLens
          </span>
        </header>

        <table className="mt-5 w-full border-separate border-spacing-0 overflow-hidden rounded-md border-2 border-black">
          <tbody>
            {SLOTS.map((slot, n) => {
              const due = items.filter((i) => i.slots?.includes(slot));
              const line = n ? 'border-t border-[#C5CEDA]' : '';
              return (
                <tr key={slot}>
                  <th scope="row" className={`w-36 bg-[#F4F6F9] px-5 py-4 text-left align-top ${line}`}>
                    <span className="block text-h3">{tr(slot)}</span>
                    <span className="text-small font-semibold text-[#46536A]">{slotTime(slot)}</span>
                  </th>
                  <td className={`px-5 py-4 align-top text-body ${line}`}>
                    {due.length ? (
                      <ul className="space-y-2">
                        {due.map((m) => (
                          <li key={m.id} className="flex gap-3"><Box /><span><strong>{m.name} {m.strength}</strong>{note(m, tr) && ` · ${note(m, tr)}`}</span></li>
                        ))}
                      </ul>
                    ) : <p className="pt-1 text-[#46536A]">{tr('nothingToTake')}</p>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <section className="flex flex-col rounded-md border-2 border-black p-5">
            <h3 className="text-h3">{tr('onlyIfNeeded')}</h3>
            {prn.length ? prn.map((m) => (
              <p key={m.id} className="mt-2 border-b border-[#C5CEDA] pb-2 text-body"><strong>{m.name} {m.strength}</strong>{m.purpose ? ` · ${pl(m.purpose, lang).toLowerCase()}` : ''}</p>
            )) : <p className="mt-2 text-[#46536A]">{tr('nothingToTake')}</p>}
            <p className="mt-auto pt-6 text-small text-[#46536A]">{tr('notes')}</p>
            <div className="mt-6 border-b border-[#C5CEDA]" /><div className="mt-6 border-b border-[#C5CEDA]" />
          </section>
          <section className="flex flex-col overflow-hidden rounded-md border-2 border-[#B4232A]">
            <div className="flex-1 p-5">
              <h3 className="text-h3 text-[#B4232A]">{REDFLAG_HEADING[lang]}</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-body">
                {flags.map((g) => <li key={g}>{REDFLAGS[g][lang]}</li>)}
              </ul>
            </div>
            <p className="flex items-center justify-between gap-3 bg-[#0F1B2D] px-5 py-3 text-white">
              <span className="font-semibold">{tr('emergencyBar')}</span><span className="text-h3 font-semibold">{tr('call911')}</span>
            </p>
          </section>
        </div>

        <footer className="mt-5 flex flex-wrap items-center gap-5 border-t border-[#DCE2EA] pt-5">
          {items.length > 0 && url.length < 2500 && <QRCodeSVG value={url} size={96} level="L" marginSize={0} aria-label={tr('scanToOpen')} />}
          <div className="min-w-48 flex-1">
            <p className="text-lead font-semibold">{tr('scanToOpen')}</p>
            <p className="text-small text-[#46536A]">{tr('scanToOpenSub')}</p>
          </div>
          <p className="max-w-56 text-right text-[12px] text-[#46536A]">{tr('footerNote')} {tr('dataSource')}.</p>
        </footer>
      </article>
      <div className="mt-5 flex justify-end">
        <Button onClick={() => window.print()}><Printer className="size-5" aria-hidden="true" />{tr('print')}</Button>
      </div>
    </Modal>
  );
}
