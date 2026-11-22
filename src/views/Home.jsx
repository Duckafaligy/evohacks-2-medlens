// Interim homepage. The full design is being rebuilt as section components in src/home/.
import { useEffect } from 'react';
import { ScanLine, Languages, BellRing, Lock } from 'lucide-react';
import { useApp } from '../components/ctx.js';
import SiteNav from '../components/SiteNav.jsx';
import { Footer } from '../components/ui.jsx';
import { SCENARIOS } from '../data/scenarios.js';

export default function Home({ hash }) {
  const { tr, lang, tryExample } = useApp();
  useEffect(() => {
    const id = { '#/how': 'how', '#/privacy': 'privacy', '#/examples': 'examples' }[hash];
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);
  const steps = [[ScanLine, 'stepScan', 'stepScanBody'], [Languages, 'stepUnderstand', 'stepUnderstandBody'], [BellRing, 'stepRemember', 'stepRememberBody']];

  return (
    <div className="min-h-screen bg-canvas">
      <SiteNav />
      <main id="main" tabIndex={-1} className="mx-auto max-w-6xl px-4 outline-none md:px-6">
        <section className="py-16 md:py-24">
          <h1 className="rise max-w-3xl text-h1 leading-[1.05] md:text-display">
            {tr('heroA')} <em className="text-primary">{tr('heroB')}</em>
          </h1>
          <p className="rise mt-5 max-w-xl text-lead text-ink-2" style={{ '--i': 1 }}>{tr('heroSub')}</p>
          <div className="rise mt-8 flex flex-wrap gap-3" style={{ '--i': 2 }}>
            <a href="#/app/today" className="btn inline-flex items-center rounded-md bg-primary px-6 text-lead font-semibold text-white hover:bg-primary/90">{tr('openApp')}</a>
            <button type="button" onClick={() => tryExample(SCENARIOS[0].id)} className="btn rounded-md border border-control bg-surface px-6 text-lead font-semibold hover:bg-canvas">{tr('tryExample')}</button>
          </div>
        </section>

        <section id="how" aria-labelledby="how-h" className="scroll-mt-24 py-12">
          <h2 id="how-h" className="text-h2">{tr('howTitle')}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {steps.map(([Icon, h, b], i) => (
              <article key={h} className="rise rounded-lg border border-line bg-surface p-6" style={{ '--i': i }}>
                <Icon className="size-7 text-primary" aria-hidden="true" />
                <h3 className="mt-3 text-h3">{tr(h)}</h3>
                <p className="mt-1 text-ink-2">{tr(b)}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="examples" aria-labelledby="ex-h" className="scroll-mt-24 py-12">
          <h2 id="ex-h" className="text-h2">{tr('examples')}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {SCENARIOS.map((s) => (
              <button key={s.id} type="button" onClick={() => tryExample(s.id)} className="rounded-lg border border-line bg-surface p-6 text-left hover:shadow-md">
                <h3 className="text-h3">{s.title[lang]}</h3>
                <p className="mt-2 text-ink-2">{s.patient[lang]}</p>
              </button>
            ))}
          </div>
        </section>

        <section id="privacy" aria-labelledby="priv-h" className="grad-ink my-12 scroll-mt-24 rounded-lg p-8 text-white md:p-12">
          <Lock className="size-7" aria-hidden="true" />
          <h2 id="priv-h" className="mt-3 text-h2">{tr('privacyTitle')}</h2>
          <p className="mt-2 max-w-2xl text-lead opacity-90">{tr('privacyBody')}</p>
        </section>
        <div className="pb-10"><Footer /></div>
      </main>
    </div>
  );
}
