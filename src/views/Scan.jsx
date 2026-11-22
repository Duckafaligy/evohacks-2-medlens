import { useEffect, useRef, useState } from 'react';
import { Camera, Upload, ClipboardPaste, ArrowRight, Plus } from 'lucide-react';
import { useApp } from '../components/ctx.js';
import { Button } from '../components/ui.jsx';
import { startCamera, stopCamera, captureFrame } from '../lib/camera.js';
import { runOcr } from '../lib/ocr.js';
import { parseText } from '../lib/parse.js';
import { fkGrade } from '../lib/readability.js';
import { addOwnMeds, loadExample, pl, MED_COLORS } from '../lib/app.js';
import * as cabinet from '../lib/cabinet.js';
import { SCENARIOS } from '../data/scenarios.js';

const foodText = (m, tr) => [({ with: tr('withFood'), before: tr('beforeFood'), without: tr('emptyStomach') })[m.withFood], m.water && tr('fullGlassWater')].filter(Boolean).join(', ');

const TABS = [['camera', 'tabCamera', Camera], ['upload', 'tabUpload', Upload], ['paste', 'tabPaste', ClipboardPaste]];

function CameraError({ code, onFail }) {
  const { tr } = useApp();
  return (
    <div className="flex flex-col items-start gap-4 rounded-lg border border-line bg-surface p-6" role="status">
      <p className="text-[17px] leading-6">{tr(code === 'denied' ? 'cameraDenied' : 'noCamera')}</p>
      <Button variant="secondary" onClick={onFail}><Upload className="size-4" aria-hidden="true" />{tr('uploadInstead')}</Button>
    </div>
  );
}

function CameraPanel({ onImage, onFail }) {
  const { tr } = useApp();
  const video = useRef(null);
  const [err, setErr] = useState(null);
  const [live, setLive] = useState(false);
  useEffect(() => {
    let stream;
    let alive = true;
    startCamera(video.current)
      .then((s) => { stream = s; if (alive) setLive(true); else stopCamera(s); })
      .catch((e) => alive && setErr(e?.code || 'no-camera'));
    return () => { alive = false; stopCamera(stream); };
  }, []);
  const capture = async () => {
    try { onImage(await captureFrame(video.current)); } catch { setErr('no-camera'); }
  };
  if (err) return <CameraError code={err} onFail={onFail} />;
  return (
    <div className="grad-ink relative flex min-h-[420px] flex-col items-center justify-center overflow-hidden rounded-lg p-6 text-white">
      <video ref={video} className={`absolute inset-0 size-full object-cover ${live ? 'opacity-60' : 'opacity-0'}`} aria-label={tr('cameraView')} />
      {live && <span className="absolute left-5 top-5 flex items-center gap-2 rounded-sm bg-black/50 px-2.5 py-1 text-small font-semibold"><span className="size-2 rounded-full bg-[#4ADE80]" aria-hidden="true" />{tr('live')}</span>}
      {err ? (
        <div className="relative max-w-sm text-center" role="alert">
          <p className="text-h3">{tr(err === 'denied' ? 'cameraDenied' : 'noCamera')}</p>
          <Button variant="secondary" className="mt-5" onClick={onFail}><Upload className="size-5" aria-hidden="true" />{tr('tabUpload')}</Button>
        </div>
      ) : (
        <>
          <div className="relative grid aspect-[4/3] w-full max-w-sm place-items-center rounded-md border-[3px] border-white/90">
            <p className="mt-auto pb-4 font-semibold">{tr('fitLabel')}</p>
          </div>
          <button type="button" onClick={capture} disabled={!live}
            className="btn relative mt-8 flex items-center gap-2 rounded-md bg-white px-8 text-lead font-semibold text-ink disabled:opacity-60">
            <Camera className="size-5" aria-hidden="true" />{tr('capture')}
          </button>
        </>
      )}
    </div>
  );
}

function UploadPanel({ onImage }) {
  const { tr } = useApp();
  const [over, setOver] = useState(false);
  const input = useRef(null);
  const take = (f) => f && f.type.startsWith('image/') && onImage(f);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files[0]); }}
      className={`flex min-h-[420px] flex-col items-center justify-center gap-[22px] rounded-lg border-2 border-dashed p-5 text-center sm:min-h-[520px] sm:p-8 transition-colors ${over ? 'border-primary bg-primary-soft' : 'bg-surface'}`}
      style={over ? undefined : { borderColor: '#9AA6B8' }}
    >
      <span className="grid size-[72px] place-items-center rounded-lg bg-primary-soft text-primary" aria-hidden="true"><Upload className="size-[34px]" strokeWidth={1.8} /></span>
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-[24px] font-semibold leading-[30px] tracking-[-0.01em]">{tr('dropLabel')}</p>
        <p className="text-[16px] leading-[22px] text-ink-2">{tr('fileTypes')}</p>
      </div>
      <button type="button" onClick={() => input.current?.click()} className="flex h-12 items-center rounded-md bg-primary px-[22px] text-[16px] font-semibold leading-5 text-white hover:bg-primary/90">
        {tr('choosePhoto')}
      </button>
      <input ref={input} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={(e) => take(e.target.files[0])} />
      <div className="flex w-[360px] max-w-full items-center gap-3 text-[14px] leading-[18px] text-ink-2" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />{tr('or')}<span className="h-px flex-1 bg-line" />
      </div>
      <button type="button" onClick={() => onImage('/sample-rx.png')}
        className="flex items-center gap-3.5 rounded-md border border-line bg-surface py-2.5 pl-2.5 pr-4 text-left hover:shadow-md">
        <img src="/sample-rx.png" alt="" width="84" height="56" className="h-14 w-[84px] shrink-0 rounded-sm border object-cover" style={{ borderColor: '#DCD6C8' }} />
        <span className="flex flex-col gap-0.5">
          <span className="text-[16px] font-semibold leading-[22px] text-primary">{tr('trySamplePrescription')}</span>
          <span className="text-[14px] leading-[18px] text-ink-2">{tr('sampleSub')}</span>
        </span>
      </button>
    </div>
  );
}

export default function Scan() {
  const { tr, lang, raw, setRaw, go, toast } = useApp();
  const [tab, setTab] = useState(() => (window.location.hash.endsWith('/paste') ? 'paste' : 'upload'));
  const [text, setText] = useState('');
  const [draft, setDraft] = useState('');
  const [example, setExample] = useState(null);
  const [progress, setProgress] = useState(null); // null idle, 0..1 reading
  const [error, setError] = useState('');

  const ocr = async (src) => {
    setError(''); setExample(null); setProgress(0);
    try {
      const out = await runOcr(src, setProgress);
      setText(out); setDraft(out);
    } catch {
      setError(tr('ocrFailed'));
    } finally {
      setProgress(null);
    }
  };

  const sc = example && SCENARIOS.find((s) => s.id === example);
  const meds = sc ? sc.meds : parseText(text);
  const before = text ? fkGrade(text) : 0;
  const after = meds.length ? fkGrade(meds.map((m) => pl(m.plain, 'en')).join(' ')) : 0;

  const pickExample = (id) => {
    const s = SCENARIOS.find((x) => x.id === id);
    setExample(id); setText(s.raw); setDraft(s.raw); setTab('paste');
  };
  const add = (to = 'today') => {
    if (sc) loadExample(sc.id);
    else {
      const prevRaw = raw;
      const undo = addOwnMeds(meds);
      if (undo) toast(tr('exampleCleared'), tr('undo'), () => { cabinet.restore(undo); setRaw(prevRaw); });
    }
    setRaw(text);
    go(to);
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-[32px] font-semibold leading-10 tracking-[-0.025em] sm:text-[40px] sm:leading-[46px]">{tr('scanTitle')}</h1>
        <div role="tablist" aria-label={tr('scanTitle')} className="flex h-10 w-full gap-0.5 rounded-[8px] p-0.5 sm:w-auto" style={{ background: '#E9EDF2' }}>
          {TABS.map(([id, key, Icon]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
              className={`flex h-9 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-sm border px-2 text-[14px] leading-[18px] sm:flex-none sm:gap-2 sm:px-3.5 sm:text-[15px] ${tab === id ? 'border-line bg-surface font-semibold text-ink' : 'border-transparent text-ink-2 hover:text-ink'}`}>
              <Icon className="size-4" aria-hidden="true" />{tr(key)}
            </button>
          ))}
        </div>
      </header>

      <div className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div role="tabpanel">
          {tab === 'camera' && <CameraPanel onImage={ocr} onFail={() => setTab('upload')} />}
          {tab === 'upload' && <UploadPanel onImage={ocr} />}
          {tab === 'paste' && (
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setExample(null); setText(draft); }}>
              <label htmlFor="rx-text" className="block font-semibold">{tr('pastePrescription')}</label>
              <textarea id="rx-text" value={draft} onChange={(e) => setDraft(e.target.value)} rows={10} placeholder={tr('pastePlaceholder')}
                className="w-full rounded-md border border-control bg-surface p-4 font-mono text-body" />
              <Button type="submit" disabled={!draft.trim()}>{tr('translate')}<ArrowRight className="size-5" aria-hidden="true" /></Button>
            </form>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <section className="flex flex-col gap-2.5 rounded-md border border-line bg-surface p-5">
            <div className="flex justify-between">
              <h2 className="text-[17px] font-semibold leading-[22px]">{tr('readingLabel')}</h2>
              <span className="text-[14px] font-semibold leading-[18px] text-ink-2">{progress !== null ? `${Math.round(progress * 100)}%` : text ? '100%' : tr('waitingShort')}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-[4px] bg-primary-soft" role="progressbar" aria-label={tr('readingLabel')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((progress ?? (text ? 1 : 0)) * 100)}>
              <div className="h-full rounded-[4px] bg-primary transition-[width] duration-300" style={{ width: `${Math.round((progress ?? (text ? 1 : 0)) * 100)}%` }} />
            </div>
            <p className="text-[15px] leading-[18px] text-ink-2" aria-live="polite">
              {error || (meds.length ? `${tr('found')}: ${meds[0].name} ${meds[0].dose || meds[0].strength || ''}` : tr('addPhotoToStart'))}
            </p>
          </section>
          <section className="flex flex-col gap-3 rounded-md border border-line bg-surface p-5">
            <h2 className="text-[17px] font-semibold leading-[22px]">{tr('tips')}</h2>
            <ul className="flex flex-col gap-3 text-[16px] leading-5">
              <li>{tr('tipLight')}</li><li>{tr('tipStill')}</li><li>{tr('tipFlat')}</li>
            </ul>
          </section>
          <section className="flex flex-col gap-2.5 rounded-md border border-line bg-surface p-5">
            <h2 className="text-[17px] font-semibold leading-[22px]">{tr('noLabel')}</h2>
            <div className="flex flex-col gap-2">
              {SCENARIOS.map((s) => (
                <button key={s.id} type="button" onClick={() => pickExample(s.id)}
                  className={`flex h-11 items-center rounded-[8px] border-[1.5px] px-3.5 text-left text-[15px] font-semibold leading-[18px] hover:bg-canvas ${example === s.id ? 'border-primary bg-primary-soft' : 'border-control'}`}>
                  {s.title[lang]}
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {text && (
        <section aria-labelledby="results-h" className="rise flex flex-col gap-8 rounded-lg border border-line bg-surface px-7 py-6 lg:flex-row">
          <div className="flex min-w-0 flex-1 flex-col">
            <h2 id="results-h" className="sr-only">{tr('foundMeds', { n: meds.length })}</h2>
            {meds.length === 0 ? <p className="text-[17px]">{tr('noMedsFound')}</p> : meds.map((m, i) => (
              <article key={m.id || i} className={`flex flex-col gap-3.5 py-5 first:pt-0 last:pb-0 ${i ? 'border-t' : ''}`} style={{ borderColor: '#EBEFF4' }}>
                <h3 className="flex items-center gap-2.5 text-[22px] font-semibold leading-7 tracking-[-0.01em]">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: MED_COLORS[i % MED_COLORS.length] }} aria-hidden="true" />
                  {m.name} {m.dose}
                </h3>
                <dl className="flex flex-col gap-2.5">
                  {[
                    ['howMuch', m.dose || '—'],
                    ['whenLabel', `${m.prn ? tr('asNeeded') : m.slots.map((x) => tr(x)).join(' + ')}${m.days ? ` · ${m.days} ${tr('days')}` : ''}`],
                    ['howLabel', foodText(m, tr)],
                    ['plainWords', pl(m.plain, lang)],
                  ].filter(([, v]) => v).map(([k, v]) => (
                    <div key={k} className="flex items-baseline gap-3">
                      <dt className="w-[120px] shrink-0 text-[14px] leading-5 text-ink-2">{tr(k)}</dt>
                      <dd className="max-w-[65ch] text-[17px] leading-6">{v}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
          {meds.length > 0 && (
            <div className="flex shrink-0 flex-col justify-between gap-3.5 border-t pt-6 lg:w-[300px] lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0" style={{ borderColor: '#EBEFF4' }}>
              <div className="flex flex-col gap-2">
                <p className="text-[14px] leading-[18px] text-ink-2">{tr('readability')}</p>
                <p className="flex items-center gap-2.5">
                  <span className="rounded-sm bg-danger-soft px-2.5 py-1 text-[15px] font-semibold leading-[18px] text-danger">{tr('gradeN', { n: Math.round(before) })}</span>
                  <ArrowRight className="size-[18px] text-ink-2" aria-hidden="true" />
                  <span className="rounded-sm bg-safe-soft px-2.5 py-1 text-[15px] font-semibold leading-[18px] text-safe">{tr('gradeN', { n: Math.max(1, Math.round(after)) })}</span>
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button type="button" onClick={() => add()} className="flex h-12 items-center justify-center gap-2 rounded-md bg-primary text-[16px] font-semibold leading-5 text-white hover:bg-primary/90">
                  <Plus className="size-[18px]" strokeWidth={2.4} aria-hidden="true" />{tr('addToCabinet')}
                </button>
                <button type="button" onClick={() => add('translate')} className="flex h-10 items-center justify-center rounded-md border border-line text-[15px] font-semibold leading-[18px] hover:bg-canvas">
                  {tr('seeTranslation')}
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
