// App shell pieces ported from Paper (Today · Desktop): top bar, example switcher, slim footer.
import { useEffect, useRef } from 'react';
import { Search, ScanLine } from 'lucide-react';
import { useApp, useCabinet, useNow } from './ctx.js';
import { SCENARIOS } from '../data/scenarios.js';

export function TopBar() {
  const { tr, lang, go } = useApp();
  const input = useRef(null);
  const now = useNow(60000);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); input.current?.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const submit = (e) => {
    e.preventDefault();
    const q = input.current.value.trim();
    window.location.hash = `#/app/cabinet${q ? `?q=${encodeURIComponent(q)}` : ''}`;
  };
  return (
    <div className="hidden items-center gap-4 border-b border-line pb-5 md:flex">
      <p className="flex-1 text-[15px] leading-5 text-ink-2">
        {now.toLocaleDateString(lang === 'zh' ? 'zh-CN' : lang, { weekday: 'long', month: 'short', day: 'numeric' })}
      </p>
      <form role="search" onSubmit={submit} className="flex h-10 w-[340px] shrink-0 items-center gap-2.5 rounded-md border border-line bg-surface px-3 focus-within:outline focus-within:outline-3 focus-within:outline-primary">
        <Search className="size-4 shrink-0 text-ink-2" aria-hidden="true" />
        <input ref={input} type="search" aria-label={tr('searchMeds')} placeholder={tr('searchMeds')}
          className="min-w-0 flex-1 bg-transparent text-[15px] leading-5 text-ink outline-none placeholder:text-ink-2" />
        <kbd className="rounded-sm border border-line px-1.5 py-px font-mono text-[12px] leading-4 text-ink-2">Ctrl K</kbd>
      </form>
      <button type="button" onClick={() => go('scan')} className="flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-[15px] font-semibold leading-5 text-white hover:bg-primary/90">
        <ScanLine className="size-4" aria-hidden="true" />{tr('scanTitle')}
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
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-[14px] leading-[18px] text-ink-2">{tr('example').replace(/[:：]\s*$/, '')}</span>
      <div role="radiogroup" aria-label={tr('example')} className="flex h-9 gap-0.5 rounded-[8px] p-0.5" style={{ background: '#E9EDF2' }}>
        {SCENARIOS.map((s) => (
          <button key={s.id} type="button" role="radio" aria-checked={active === s.id} onClick={() => tryExample(s.id, false)}
            className={`flex h-8 items-center rounded-sm border px-3.5 text-[14px] leading-[18px] ${active === s.id ? 'border-line bg-surface font-semibold text-ink' : 'border-transparent text-ink-2 hover:text-ink'}`}>
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
