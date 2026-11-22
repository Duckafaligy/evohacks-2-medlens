import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppCtx, useHash } from './components/ctx.js';
import Sidebar from './components/Sidebar.jsx';
import FridgeCard from './components/FridgeCard.jsx';
import AuthModal from './components/AuthModal.jsx';
import { Footer } from './components/ui.jsx';
import Home from './views/Home.jsx';
import Today from './views/Today.jsx';
import Scan from './views/Scan.jsx';
import Cabinet from './views/Cabinet.jsx';
import Translate from './views/Translate.jsx';
import Safety from './views/Safety.jsx';
import Calendar from './views/Calendar.jsx';
import Quiz from './views/Quiz.jsx';
import { t } from './data/i18n.js';
import { planFromHash } from './lib/share.js';
import { restorePlan, loadExample } from './lib/app.js';
import { stop } from './lib/speech.js';

const VIEWS = { today: Today, scan: Scan, cabinet: Cabinet, translate: Translate, safety: Safety, calendar: Calendar, quiz: Quiz };

const read = (k, d) => {
  try { return localStorage.getItem(k) ?? d; } catch { return d; }
};
const write = (k, v) => {
  try { localStorage.setItem(k, v); } catch { /* private mode */ }
};

// A shared #plan= link restores into the cabinet once, before first render.
const sharedPlan = planFromHash();
if (sharedPlan && restorePlan(sharedPlan)) window.location.replace('#/app/today');

export default function App() {
  const hash = useHash();
  const [lang, setLangState] = useState(() => read('medlens.lang', 'en'));
  const [senior, setSeniorState] = useState(() => read('medlens.senior', '0') === '1');
  const [raw, setRawState] = useState(() => read('medlens.raw', ''));
  const [fridge, setFridge] = useState(false);
  const [auth, setAuth] = useState(false);

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
    tryExample: (id) => { setRaw(loadExample(id)); window.location.hash = '#/app/today'; },
    openFridge: () => setFridge(true),
    openAuth: () => setAuth(true),
  }), [lang, setLang, senior, setSenior, raw, setRaw]);

  const m = hash.match(/^#\/app\/?(\w*)/);
  const view = m ? (VIEWS[m[1]] ? m[1] : 'today') : null;
  const View = view && VIEWS[view];

  useEffect(() => { window.scrollTo(0, 0); }, [view]);

  return (
    <AppCtx.Provider value={ctx}>
      <a href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        {ctx.tr('skipToContent')}
      </a>
      {View ? (
        <div className="min-h-screen md:flex">
          <Sidebar view={view} />
          <main id="main" tabIndex={-1} className="min-w-0 flex-1 px-4 pb-28 pt-6 outline-none md:px-12 md:pb-10 md:pt-10">
            <View key={view} />
            <Footer />
          </main>
        </div>
      ) : (
        <Home hash={hash} />
      )}
      <FridgeCard open={fridge} onClose={() => setFridge(false)} />
      <AuthModal open={auth} onClose={() => setAuth(false)} />
    </AppCtx.Provider>
  );
}
