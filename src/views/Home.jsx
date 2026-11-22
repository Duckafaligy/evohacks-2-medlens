import SiteNav from '../components/SiteNav.jsx';
import { Hero, Problem, How, Features, Warning, Who, Senior, Privacy, Faq, Cta } from '../home/Sections.jsx';
import SiteFooter, { LegalModal } from '../home/SiteFooter.jsx';

/** Homepage. `#/legal/<page>` opens the Privacy / Terms / Disclaimer modal over it. */
export default function Home({ hash }) {
  const legal = hash.match(/^#\/legal\/(\w+)/)?.[1] || null;
  return (
    <div className="min-h-screen bg-canvas">
      <SiteNav />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <Problem />
        <How />
        <Features />
        <Warning />
        <Who />
        <Senior />
        <Privacy />
        <Faq />
        <Cta />
      </main>
      <SiteFooter />
      <LegalModal page={legal} onClose={() => { window.location.hash = '#/'; }} />
    </div>
  );
}
