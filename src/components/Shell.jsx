// App shell pieces ported from Paper (Today · Desktop): top bar, example switcher, slim footer.
import { ScanLine } from 'lucide-react';
import { useApp, useCabinet } from './ctx.js';
import { SCENARIOS } from '../data/scenarios.js';

export function TopBar() {
  const { tr, go } = useApp();
  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-line pb-5">
      <div className="min-w-0 flex-1"><ExampleSwitcher /></div>
      <button type="button" onClick={() => go('scan')} className="flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-[15px] font-semibold leading-5 text-white hover:bg-primary/90">
        <ScanLine className="size-4" aria-hidden="true" />{tr('scanOrPaste')}
      </button>
    </div>
  );
}

const EX_LABEL = { cardiac: 'exCardiac', pediatric: 'exPediatric', 'diabetes-warfarin': 'exDiabetes' };

/** "Example: [Senior Cardiac | Pediatric | Diabetes + Blood Thinner]" — switching replaces the cabinet. */
export function ExampleSwitcher() {
  const { tr, tryExample } = useApp();
  const { items } = useCabinet();
  const active = SCENARIOS.find((s) => items.length && items.every((i) => i.ex?.startsWith(`${s.id}:`)))?.id;
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="hidden text-[14px] leading-[18px] text-ink-2 sm:inline">{tr('example').replace(/[:：]\s*$/, '')}</span>
      <div role="radiogroup" aria-label={tr('example')} className="flex h-9 min-w-0 gap-0.5 overflow-x-auto rounded-[8px] p-0.5" style={{ background: '#E9EDF2' }}>
        {SCENARIOS.map((s) => (
          <button key={s.id} type="button" role="radio" aria-checked={active === s.id} onClick={() => tryExample(s.id, false)}
            className={`flex h-8 shrink-0 items-center whitespace-nowrap rounded-sm border px-3.5 text-[14px] leading-[18px] ${active === s.id ? 'border-line bg-surface font-semibold text-ink' : 'border-transparent text-ink-2 hover:text-ink'}`}>
            {tr(EX_LABEL[s.id])}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AppFooter() {
  const { tr } = useApp();
  return (
    <footer className="mt-auto flex items-center justify-between gap-4 border-t border-line pt-3.5 text-[13px] leading-[18px]">
      <p className="text-ink-2">{tr('footerNote')} · <a href="tel:911" className="hover:underline">{tr('emergencyShort')}</a></p>
      <a href="#/" className="font-semibold text-primary hover:underline">{tr('home')}</a>
    </footer>
  );
}
