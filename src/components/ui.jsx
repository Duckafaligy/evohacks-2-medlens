import { useEffect, useRef } from 'react';
import { ScanSearch, X } from 'lucide-react';
import { useApp } from './ctx.js';
import { GITHUB, OPENFDA } from '../data/links.js';

const BTN = {
  primary: 'bg-primary text-white hover:bg-primary/90',
  secondary: 'bg-surface text-ink border border-control hover:bg-canvas',
  soft: 'bg-primary-soft text-primary hover:bg-primary-soft/70',
  ghost: 'text-primary hover:bg-primary-soft',
  danger: 'bg-surface text-danger border border-danger/40 hover:bg-danger-soft',
};

export function Button({ variant = 'primary', className = '', children, ...rest }) {
  return (
    <button
      type="button"
      className={`btn inline-flex items-center justify-center gap-2 rounded-md px-5 text-body font-semibold transition-colors duration-150 disabled:opacity-50 ${BTN[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export const Card = ({ as: Tag = 'section', className = '', children, ...rest }) => (
  <Tag className={`rounded-md border border-line bg-surface p-5 ${className}`} {...rest}>{children}</Tag>
);

const TONES = {
  safe: 'bg-safe-soft text-safe',
  info: 'bg-info-soft text-info',
  caution: 'bg-caution-soft text-caution',
  danger: 'bg-danger-soft text-danger',
  primary: 'bg-primary-soft text-primary',
  neutral: 'bg-canvas text-ink-2',
  solidDanger: 'bg-danger text-white',
};
export const Chip = ({ tone = 'neutral', className = '', children }) => (
  <span className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-small font-semibold ${TONES[tone]} ${className}`}>{children}</span>
);

const SEVERITY_TONE = { High: 'danger', Moderate: 'caution', Low: 'info' };
export function SeverityChip({ severity }) {
  const { tr } = useApp();
  const solid = severity === 'High';
  return <Chip tone={solid ? 'solidDanger' : SEVERITY_TONE[severity]}>{tr(severity.toLowerCase())}</Chip>;
}

export function FoodChips({ med }) {
  const { tr } = useApp();
  return (
    <span className="flex flex-wrap gap-1.5">
      {med.withFood === 'with' && <Chip tone="safe">{tr('withFood')}</Chip>}
      {med.withFood === 'without' && <Chip tone="caution">{tr('emptyStomach')}</Chip>}
      {med.withFood === 'before' && <Chip tone="caution">{tr('beforeFood')}</Chip>}
      {med.water && <Chip tone="info">{tr('fullGlassWater')}</Chip>}
    </span>
  );
}

export function SourceBadge({ source }) {
  const { tr } = useApp();
  if (source === 'openfda') return <Chip tone="safe">{tr('sourceLive')}</Chip>;
  if (source === 'snapshot') return <Chip tone="info">{tr('sourceSaved')}</Chip>;
  return <Chip>{tr('sourceNone')}</Chip>;
}

export const Logo = ({ className = '' }) => (
  <span className={`inline-flex items-center gap-2.5 text-h3 font-semibold text-ink ${className}`}>
    <span className="grid size-9 place-items-center rounded-md bg-primary text-white" aria-hidden="true">
      <ScanSearch className="size-5" />
    </span>
    MedLens
  </span>
);

/** Accessible modal: Escape closes, focus moves in, click on backdrop closes. */
export function Modal({ open, onClose, title, children, wide = false, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    ref.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`pop max-h-[90vh] w-full overflow-auto rounded-lg bg-surface p-6 shadow-xl ${wide ? 'max-w-3xl' : 'max-w-md'} ${className}`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-h3">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-2 text-ink-2 hover:bg-canvas">
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, title, children }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    ref.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/30" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className="pop h-full w-full max-w-lg overflow-auto bg-surface p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="text-h2">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-2 text-ink-2 hover:bg-canvas">
            <X className="size-6" />
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
}


export function Footer() {
  const { tr } = useApp();
  const link = 'text-primary hover:underline';
  return (
    <footer className="mt-12 border-t border-line pt-6 text-small text-ink-2">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="flex items-center gap-3">
          <span className="grid size-7 place-items-center rounded-sm bg-primary text-white" aria-hidden="true"><ScanSearch className="size-4" /></span>
          <span className="text-ink">{tr('footerNote')}</span>
        </p>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-5">
          <a className={link} href="#/app/today">{tr('navApp')}</a>
          <a className={link} href="#/">{tr('howItWorks')}</a>
          <a className={link} href="#/legal/privacy">{tr('privacy')}</a>
          <a className={link} href={GITHUB} target="_blank" rel="noreferrer">GitHub</a>
          <a className="hover:underline" href={OPENFDA} target="_blank" rel="noreferrer">{tr('dataSource')}</a>
        </nav>
      </div>
      <p className="mt-4">© 2026 MedLens · {tr('builtFor')}</p>
    </footer>
  );
}

export function ProgressBar({ value, label, tone = 'primary', className = '' }) {
  const color = { primary: 'bg-primary', safe: 'bg-safe', danger: 'bg-danger' }[tone];
  return (
    <div className={`h-2 w-full overflow-hidden rounded-sm bg-primary-soft ${className}`} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}>
      <div className={`h-full ${color} transition-[width] duration-300`} style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}
