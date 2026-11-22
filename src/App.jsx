import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppCtx, useHash } from './components/ctx.js';
import Sidebar from './components/Sidebar.jsx';
import FridgeCard from './components/FridgeCard.jsx';
import AuthModal from './components/AuthModal.jsx';
import { TopBar, AppFooter, Toast } from './components/Shell.jsx';
import Home from './views/Home.jsx';
import Today from './views/Today.jsx';
import Scan from './views/Scan.jsx';
import Cabinet from './views/Cabinet.jsx';
import Translate from './views/Translate.jsx';
import Safety from './views/Safety.jsx';
import { t } from './data/i18n.js';
import { planFromHash } from './lib/share.js';
import { restorePlan, loadExample } from './lib/app.js';
import { stop } from './lib/speech.js';
import * as cabinet from './lib/cabinet.js';

// calendar = Today's Week view; quiz = the card at the bottom of Translate.
const VIEWS = { today: Today, scan: Scan, cabinet: Cabinet, translate: Translate, safety: Safety, calendar: Today, quiz: Translate };

const read = (k, d) => {
  try { return localStorage.getItem(k) ?? d; } catch { return d; }
};
const write = (k, v) => {
  try { localStorage.setItem(k, v); } catch { /* private mode */ }
};

// A shared #plan= link restores into the cabinet once, before first render.
const sharedPlan = planFromHash();
if (sharedPlan && restorePlan(sharedPlan)) window.location.replace('#/app/today');

/** First visit to /app with an empty cabinet loads the cardiac example, once ever. */
function maybeSeed() {
  if (!window.location.hash.startsWith('#/app') || read('medlens.seeded', '') === '1') return false;
  write('medlens.seeded', '1');
  if (cabinet.list().length) return false;
  write('medlens.raw', loadExample('cardiac'));
  return true;
}
maybeSeed();

export default function App() {
  const hash = useHash();
  const [lang, setLangState] = useState(() => read('medlens.lang', 'en'));
  const [senior, setSeniorState] = useState(() => read('medlens.senior', '0') === '1');
  const [raw, setRawState] = useState(() => read('medlens.raw', ''));
  const [fridge, setFridge] = useState(false);
  const [auth, setAuth] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const setLang = useCallback((l) => { stop(); setLangState(l); write('medlens.lang', l); }, []);
  const setSenior = useCallback((v) => { setSeniorState(v); write('medlens.senior', v ? '1' : '0'); }, []);
  const setRaw = useCallback((v) => { setRawState(v); write('medlens.raw', v); }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('senior', senior);
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
  }, [senior, lang]);

  const ctx = useMemo(() => ({
    lang, setLang, senior, setSenior, raw, setRaw,
    tr: (key, vars) => t(lang, key, vars),
    go: (view) => { window.location.hash = `#/app/${view}`; },
    tryExample: (id, nav = true) => { setRaw(loadExample(id)); if (nav) window.location.hash = '#/app/today'; },
    openFridge: () => setFridge(true),
    openAuth: () => setAuth(true),
    toast: (text, actionLabel, onAction) => setToastMsg({ text, actionLabel, onAction, id: Date.now() }),
  }), [lang, setLang, senior, setSenior, raw, setRaw]);

  const m = hash.match(/^#\/app\/?(\w*)/);
  const view = m ? (VIEWS[m[1]] ? m[1] : 'today') : null;
  const View = view && VIEWS[view];

  useEffect(() => { window.scrollTo(0, 0); }, [view]);

  // Entering the app later from the homepage also seeds (once).
  useEffect(() => {
    const on = () => { if (maybeSeed()) setRawState(read('medlens.raw', '')); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  return (
    <AppCtx.Provider value={ctx}>
      <a href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        {ctx.tr('skipToContent')}
      </a>
      {View ? (
        <div className="min-h-screen md:flex">
          <Sidebar view={view} />
          <main id="main" tabIndex={-1} className="flex min-h-screen min-w-0 flex-1 flex-col gap-6 px-4 pb-28 pt-5 outline-none md:px-10 md:pb-8">
            <TopBar />
            <View key={view} route={view} />
            <AppFooter />
          </main>
        </div>
      ) : (
        <Home hash={hash} />
      )}
      <FridgeCard open={fridge} onClose={() => setFridge(false)} />
      <AuthModal open={auth} onClose={() => setAuth(false)} />
      {toastMsg && <Toast key={toastMsg.id} {...toastMsg} onClose={() => setToastMsg(null)} />}
    </AppCtx.Provider>
  );
}
