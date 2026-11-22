import { useEffect, useState } from 'react';
import {
  Sun, ScanLine, Pill, Languages, ShieldCheck, Play, Pause, Square, ChevronRight, Menu,
} from 'lucide-react';
import { useApp, useCabinet, useInteractions } from './ctx.js';
import { Logo, Modal } from './ui.jsx';
import { LANGS } from '../data/i18n.js';
import { speak, pause, resume, stop, canSpeak } from '../lib/speech.js';
import { scheduleSpeech } from '../lib/app.js';
import { currentUser, onUser, signOut } from '../lib/auth.js';

const TABS = [['today', Sun], ['translate', Languages], ['safety', ShieldCheck]];
const MOBILE = [['today', Sun], ['translate', Languages], ['safety', ShieldCheck], ['scan', ScanLine]];
// Old routes live inside the 3 tabs now.
const TAB_OF = { calendar: 'today', quiz: 'translate' };
const VIEW_LABEL = { today: 'navToday', scan: 'navScan', cabinet: 'navCabinet', translate: 'navTranslate', safety: 'navSafety' };

function NavItem({ id, Icon, active, badge }) {
  const { tr } = useApp();
  return (
    <a
      href={`#/app/${id}`}
      aria-current={active ? 'page' : undefined}
      className={`relative flex h-10 items-center gap-3 rounded-md border px-3 text-body transition-colors ${
        active ? 'border-line bg-surface font-semibold text-ink' : 'border-transparent text-ink hover:bg-surface/70'
      }`}
    >
      {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-sm bg-primary" aria-hidden="true" />}
      <Icon className={`size-[18px] ${active ? 'text-primary' : 'text-ink-2'}`} aria-hidden="true" />
      <span className="flex-1">{tr(VIEW_LABEL[id])}</span>
      {badge > 0 && (
        <span className="grid min-w-6 place-items-center rounded-sm bg-danger px-1.5 text-small font-semibold text-white" aria-label={`${badge} ${tr('high')}`}>{badge}</span>
      )}
    </a>
  );
}

function ReadAloud() {
  const { tr, lang } = useApp();
  const { items } = useCabinet();
  const [state, setState] = useState('idle');
  if (!canSpeak()) return null;
  const start = () => speak(scheduleSpeech(items, lang), lang, { onState: setState });
  if (state === 'idle') {
    return (
      <button type="button" onClick={start} className="btn flex w-full items-center justify-center gap-2 rounded-md bg-primary-soft px-4 font-semibold text-primary hover:bg-primary-soft/70">
        <Play className="size-4" aria-hidden="true" /> {tr('readAloud')}
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2" role="group" aria-label={tr('readAloud')}>
      <span className="flex flex-1 items-center gap-2 text-small font-semibold text-primary" aria-live="polite">
        <span className={`size-2 rounded-full bg-primary ${state === 'speaking' ? 'animate-pulse' : ''}`} aria-hidden="true" />
        {state === 'speaking' ? tr('speaking') : tr('paused')}
      </span>
      {state === 'speaking'
        ? <button type="button" onClick={pause} aria-label={tr('pause')} className="btn grid w-12 place-items-center rounded-md bg-primary-soft text-primary"><Pause className="size-4" /></button>
        : <button type="button" onClick={resume} aria-label={tr('resume')} className="btn grid w-12 place-items-center rounded-md bg-primary-soft text-primary"><Play className="size-4" /></button>}
      <button type="button" onClick={stop} aria-label={tr('stopReading')} className="btn grid w-12 place-items-center rounded-md bg-primary-soft text-primary"><Square className="size-4" /></button>
    </div>
  );
}

function Preferences() {
  const { tr, lang, setLang, senior, setSenior, openAuth } = useApp();
  const { items } = useCabinet();
  const [user, setUser] = useState(() => currentUser());
  useEffect(() => onUser(setUser), []);
  return (
    <div className="space-y-3">
      <div className="space-y-3 rounded-md border border-line bg-surface p-3">
        <p className="text-[13px] text-ink-2">{tr('preferences')}</p>
        <label className="flex items-center justify-between gap-3 font-semibold">
          {tr('seniorMode')}
          <button
            type="button"
            role="switch"
            aria-checked={senior}
            onClick={() => setSenior(!senior)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${senior ? 'bg-primary' : 'bg-control'}`}
          >
            <span className={`absolute top-1 size-5 rounded-full bg-white transition-all ${senior ? 'left-6' : 'left-1'}`} />
          </button>
        </label>
        <div role="radiogroup" aria-label={tr('language')} className="grid grid-cols-4 gap-1 rounded-md bg-canvas p-1">
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              role="radio"
              aria-checked={lang === l.code}
              aria-label={l.label}
              onClick={() => setLang(l.code)}
              className={`h-9 rounded-sm text-small font-semibold ${lang === l.code ? 'bg-ink text-white' : 'text-ink hover:bg-surface'}`}
            >
              {l.code === 'zh' ? '中文' : l.code.toUpperCase()}
            </button>
          ))}
        </div>
        <ReadAloud />
      </div>
      <a href="#/app/cabinet" className="flex items-center justify-between rounded-md px-3 py-2 text-small font-semibold hover:bg-surface">
        <span className="flex items-center gap-2"><Pill className="size-4 text-ink-2" aria-hidden="true" />{tr('myMeds', { n: items.length })}</span>
        <ChevronRight className="size-4 text-ink-2" aria-hidden="true" />
      </a>
      {user ? (
        <div className="flex items-center justify-between gap-2 px-3 py-2 text-small">
          <span className="truncate text-ink" title={user.email}>{user.email}</span>
          <button type="button" onClick={() => signOut()} className="shrink-0 font-semibold text-primary hover:underline">{tr('signOut')}</button>
        </div>
      ) : (
        <button type="button" onClick={openAuth} className="flex w-full items-center justify-between rounded-md px-3 py-2 text-small hover:bg-surface">
          <span className="text-ink-2">{tr('guest')}</span>
          <span className="flex items-center gap-1 font-semibold text-primary">{tr('saveToAccount')} <ChevronRight className="size-4" aria-hidden="true" /></span>
        </button>
      )}
    </div>
  );
}

export default function Sidebar({ view }) {
  const { tr } = useApp();
  const { items } = useCabinet();
  const inter = useInteractions(items);
  const high = inter?.interactions.filter((x) => x.severity === 'High').length || 0;
  const [more, setMore] = useState(false);
  const badgeFor = (id) => (id === 'safety' ? high : 0);
  const tab = TAB_OF[view] || view;

  return (
    <>
      <div className="hidden w-[264px] shrink-0 border-r border-line bg-canvas md:block">
      <aside className="sticky top-0 flex h-dvh flex-col overflow-y-auto px-4 py-6" aria-label={tr('mainNav')}>
        <a href="#/" className="mb-6 px-2" aria-label="MedLens home"><Logo /></a>
        <nav className="flex-1 space-y-1 overflow-auto" aria-label={tr('mainNav')}>
          {TABS.map(([id, Icon]) => <NavItem key={id} id={id} Icon={Icon} active={tab === id} badge={badgeFor(id)} />)}
        </nav>
        <Preferences />
      </aside>
      </div>

      {/* Mobile: top bar + bottom tabs */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface px-4 md:hidden">
        <a href="#/" aria-label="MedLens home"><Logo className="text-lead" /></a>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface md:hidden" aria-label={tr('mainNav')}>
        {MOBILE.map(([id, Icon]) => (
          <a key={id} href={`#/app/${id}`} aria-current={tab === id ? 'page' : undefined}
            className={`relative flex h-16 flex-col items-center justify-center gap-1 text-[12px] ${tab === id ? 'font-semibold text-primary' : 'text-ink-2'}`}>
            {id === 'safety' && high > 0 && <span className="absolute right-5 top-2 size-2 rounded-full bg-danger" aria-hidden="true" />}
            <Icon className="size-5" aria-hidden="true" />{tr(VIEW_LABEL[id])}
          </a>
        ))}
        <button type="button" onClick={() => setMore(true)} className={`flex h-16 flex-col items-center justify-center gap-1 text-[12px] ${view === 'cabinet' ? 'font-semibold text-primary' : 'text-ink-2'}`}>
          <Menu className="size-5" aria-hidden="true" />{tr('more')}
        </button>
      </nav>
      <Modal open={more} onClose={() => setMore(false)} title={tr('more')}>
        <div className="mt-1" onClick={() => setMore(false)}><Preferences /></div>
      </Modal>
    </>
  );
}
