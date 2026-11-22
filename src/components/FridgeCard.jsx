import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer } from 'lucide-react';
import { useApp, useCabinet } from './ctx.js';
import { Button, Modal } from './ui.jsx';
import { SLOTS, slotTime, planOf } from '../lib/app.js';
import { shareUrl } from '../lib/share.js';
import { REDFLAGS, REDFLAG_HEADING, EMERGENCY_NOTE } from '../data/redflags.js';

const foodNote = (m, tr) =>
  ({ with: tr('withFood'), without: tr('emptyStomach'), before: tr('beforeFood') })[m.withFood] || '';

export default function FridgeCard({ open, onClose }) {
  const { tr, lang } = useApp();
  const { items } = useCabinet();
  const url = typeof window !== 'undefined' ? shareUrl(planOf(items)) : '';
  const flags = [...new Set(items.map((i) => i.generic))].filter((g) => REDFLAGS[g]);
  const prn = items.filter((i) => i.prn);
  const [printedOn] = useState(() => new Date());

  return (
    <Modal open={open} onClose={onClose} title={tr('printCard')} wide>
      <article className="print-card bg-white p-2 text-black" aria-label={tr('fridgeTitle')}>
        <header className="flex items-end justify-between border-b-4 border-black pb-3">
          <div>
            <h2 className="text-h1 leading-tight">{tr('fridgeTitle')}</h2>
            <p className="text-body">{printedOn.toLocaleDateString(lang === 'zh' ? 'zh-CN' : lang, { dateStyle: 'long' })}</p>
          </div>
          <span className="font-semibold">MedLens</span>
        </header>

        <table className="mt-5 w-full border-separate border-spacing-0 overflow-hidden rounded-md border-2 border-black">
          <tbody>
            {SLOTS.map((slot, n) => {
              const due = items.filter((i) => i.slots?.includes(slot));
              return (
                <tr key={slot}>
                  <th scope="row" className={`w-40 p-4 text-left align-top ${n ? 'border-t-2 border-black' : ''}`}>
                    <span className="block text-h3">{tr(slot)}</span>
                    <span className="text-small">{slotTime(slot)}</span>
                  </th>
                  <td className={`p-4 align-top text-body ${n ? 'border-t-2 border-black' : ''}`}>
                    {due.length ? due.map((m) => (
                      <p key={m.id}><strong>{m.name} {m.strength}</strong>{foodNote(m, tr) && ` — ${foodNote(m, tr)}`}</p>
                    )) : <p>{tr('nothingToTake')}</p>}
                  </td>
                </tr>
              );
            })}
            {prn.length > 0 && (
              <tr>
                <th scope="row" className="border-t-2 border-black p-4 text-left align-top text-h3">{tr('asNeeded')}</th>
                <td className="border-t-2 border-black p-4 text-body">
                  {prn.map((m) => <p key={m.id}><strong>{m.name} {m.strength}</strong></p>)}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="mt-5 flex gap-5">
          <section className="flex-1 rounded-md border-2 border-black p-4">
            <h3 className="text-h3">{REDFLAG_HEADING[lang]}</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-body">
              {flags.map((g) => <li key={g}>{REDFLAGS[g][lang]}</li>)}
              <li><strong>{EMERGENCY_NOTE[lang]}</strong></li>
            </ul>
          </section>
          {items.length > 0 && url.length < 2500 && (
            <figure className="flex w-36 shrink-0 flex-col items-center gap-2 text-center text-small">
              <QRCodeSVG value={url} size={132} level="L" marginSize={0} aria-label={tr('scanToOpen')} />
              <figcaption>{tr('scanToOpen')}</figcaption>
            </figure>
          )}
        </div>
        <p className="mt-4 text-small">{tr('disclaimer')}</p>
      </article>
      <div className="mt-5 flex justify-end">
        <Button onClick={() => window.print()}><Printer className="size-5" aria-hidden="true" />{tr('print')}</Button>
      </div>
    </Modal>
  );
}
