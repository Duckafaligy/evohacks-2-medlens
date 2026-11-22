import { useEffect, useState } from 'react';
import { useApp } from './ctx.js';
import { Logo, GITHUB } from './ui.jsx';

/** Homepage nav: slim bar, floats as a rounded card once you scroll. */
export default function SiteNav() {
  const { tr } = useApp();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <div className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? 'px-4 pt-3' : ''}`}>
      <nav aria-label={tr('mainNav')}
        className={`mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 transition-all duration-300 md:px-6 ${scrolled ? 'rounded-lg border border-line bg-surface/95 shadow-lg backdrop-blur' : 'bg-transparent'}`}>
        <a href="#/" aria-label="MedLens home"><Logo /></a>
        <div className="hidden items-center gap-7 md:flex">
          <a href="#/how" className="text-ink-2 hover:text-ink">{tr('howItWorks')}</a>
          <a href="#/examples" className="text-ink-2 hover:text-ink">{tr('examples')}</a>
          <a href="#/privacy" className="text-ink-2 hover:text-ink">{tr('privacy')}</a>
        </div>
        <div className="flex items-center gap-3">
          <a href={GITHUB} target="_blank" rel="noreferrer" aria-label="GitHub" className="hidden rounded-md p-2 text-ink-2 hover:bg-canvas sm:block"><svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true"><path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.7.3 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z"/></svg></a>
          <a href="#/app/today" className="inline-flex h-11 items-center rounded-md bg-primary px-4 font-semibold text-white hover:bg-primary/90">{tr('openApp')}</a>
        </div>
      </nav>
    </div>
  );
}
