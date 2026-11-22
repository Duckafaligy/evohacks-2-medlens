import { useEffect, useRef, useState } from 'react';
import { Camera, Upload, ImageUp, ArrowRight, Plus } from 'lucide-react';
import { useApp } from '../components/ctx.js';
import { Button, Card, Chip, ProgressBar } from '../components/ui.jsx';
import { startCamera, stopCamera, captureFrame } from '../lib/camera.js';
import { runOcr } from '../lib/ocr.js';
import { parseText } from '../lib/parse.js';
import { fkGrade } from '../lib/readability.js';
import { addToCabinet, loadExample, pl, MED_COLORS } from '../lib/app.js';
import { SCENARIOS } from '../data/scenarios.js';

const foodText = (m, tr) => [({ with: tr('withFood'), before: tr('beforeFood'), without: tr('emptyStomach') })[m.withFood], m.water && tr('fullGlassWater')].filter(Boolean).join(', ');

const TABS = [['camera', 'tabCamera'], ['upload', 'tabUpload'], ['paste', 'tabPaste']];

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
  const take = (f) => f && f.type.startsWith('image/') && onImage(f);
  return (
    <div className="space-y-4">
      <label
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files[0]); }}
        className={`flex min-h-[340px] cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors focus-within:ring-2 focus-within:ring-primary ${over ? 'border-primary bg-primary-soft' : 'border-control bg-surface'}`}
      >
        <ImageUp className="size-10 text-primary" aria-hidden="true" />
        <span className="text-h3">{tr('dropPhoto')}</span>
        <span className="text-ink-2">{tr('orChoose')}</span>
        <input type="file" accept="image/*" className="sr-only" onChange={(e) => take(e.target.files[0])} />
      </label>
      <Button variant="soft" onClick={() => onImage('/sample-rx.png')}>{tr('trySample')}</Button>
    </div>
  );
}

export default function Scan() {
  const { tr, lang, setRaw, go } = useApp();
  const [tab, setTab] = useState('camera');
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
    else addToCabinet(meds);
    setRaw(text);
    go(to);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-h2 md:text-h1">{tr('scanTitle')}</h1>
        <div role="tablist" aria-label={tr('scanTitle')} className="flex rounded-md border border-line bg-surface p-1">
          {TABS.map(([id, key]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
              className={`h-11 rounded-md px-4 font-semibold ${tab === id ? 'bg-ink text-white' : 'text-ink-2 hover:text-ink'}`}>
              {tr(key)}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
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

        <aside className="space-y-4">
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{tr('readingLabel')}</h2>
              <span className="font-semibold text-primary">{progress !== null ? `${Math.round(progress * 100)}%` : text ? '100%' : '—'}</span>
            </div>
            <ProgressBar className="mt-3" value={progress ?? (text ? 1 : 0)} label={tr('readingLabel')} />
            <p className="mt-2 text-small text-ink-2" aria-live="polite">
              {error || (meds.length ? `${tr('found')}: ${meds[0].name} ${meds[0].dose || meds[0].strength || ''}` : tr('waiting'))}
            </p>
          </Card>
          <Card>
            <h2 className="font-semibold">{tr('tips')}</h2>
            <ul className="mt-2 space-y-1.5">
              <li>{tr('tipLight')}</li><li>{tr('tipStill')}</li><li>{tr('tipFlat')}</li>
            </ul>
          </Card>
          <Card>
            <h2 className="font-semibold">{tr('noLabel')}</h2>
            <div className="mt-3 space-y-2">
              {SCENARIOS.map((s) => (
                <button key={s.id} type="button" onClick={() => pickExample(s.id)}
                  className={`w-full rounded-md border px-4 py-3 text-left font-semibold hover:bg-canvas ${example === s.id ? 'border-primary bg-primary-soft' : 'border-control'}`}>
                  {s.title[lang]}
                </button>
              ))}
            </div>
          </Card>
        </aside>
      </div>

      {text && (
        <section aria-labelledby="results-h" className="rise grid gap-6 rounded-lg border border-line bg-surface p-6 md:p-8 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0">
            <h2 id="results-h" className="sr-only">{tr('foundMeds', { n: meds.length })}</h2>
            {meds.length === 0 ? <p>{tr('noMedsFound')}</p> : (
              <div className="divide-y divide-line">
                {meds.map((m, i) => (
                  <article key={m.id || i} className="py-4 first:pt-0 last:pb-0">
                    <h3 className="flex items-center gap-2.5 text-h3">
                      <span className="size-2.5 rounded-full" style={{ background: MED_COLORS[i % MED_COLORS.length] }} aria-hidden="true" />
                      {m.name} {m.dose}
                    </h3>
                    <dl className="mt-3 grid grid-cols-[8rem_1fr] gap-x-6 gap-y-2">
                      <dt className="text-small text-ink-2">{tr('howMuch')}</dt><dd>{m.dose || '—'}</dd>
                      <dt className="text-small text-ink-2">{tr('whenLabel')}</dt>
                      <dd>{m.prn ? tr('asNeeded') : m.slots.map((x) => tr(x)).join(' + ')}{m.days ? ` · ${m.days} ${tr('days')}` : ''}</dd>
                      {foodText(m, tr) && <><dt className="text-small text-ink-2">{tr('howLabel')}</dt><dd>{foodText(m, tr)}</dd></>}
                      <dt className="text-small text-ink-2">{tr('plainWords')}</dt><dd>{pl(m.plain, lang)}</dd>
                    </dl>
                  </article>
                ))}
              </div>
            )}
          </div>
          {meds.length > 0 && (
            <div className="space-y-4 lg:border-l lg:border-line lg:pl-6">
              <div>
                <p className="text-small text-ink-2">{tr('readability')}</p>
                <p className="mt-2 flex items-center gap-2">
                  <Chip tone="danger" className="text-body">{tr('gradeBefore', { n: Math.round(before) })}</Chip>
                  <ArrowRight className="size-4" aria-hidden="true" />
                  <Chip tone="safe" className="text-body">{tr('gradeAfter', { n: Math.max(1, Math.round(after)) })}</Chip>
                </p>
              </div>
              <Button onClick={() => add()} className="w-full"><Plus className="size-5" aria-hidden="true" />{tr('addToCabinet')}</Button>
              <Button variant="secondary" className="w-full" onClick={() => add('translate')}>{tr('seeTranslation')}</Button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
