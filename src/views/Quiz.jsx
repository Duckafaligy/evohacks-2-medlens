import { useMemo, useState } from 'react';
import { Check, X, RotateCcw, ScanLine } from 'lucide-react';
import { useApp, useCabinet } from '../components/ctx.js';
import { Button } from '../components/ui.jsx';
import { SLOTS, pl } from '../lib/app.js';

const shuffle = (a, seed) => a.map((v, i) => [Math.sin(seed * 31 + i * 17), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
const slotKey = (slots) => SLOTS.filter((s) => slots.includes(s)).join('+');
const COMBOS = ['morning', 'bedtime', 'evening', 'morning+evening', 'morning+noon+evening', 'morning+noon+bedtime', 'morning+noon+evening+bedtime'];
const FOOD = ['with', 'before', 'without', 'any'];
const FOOD_KEY = { with: 'withFood', before: 'beforeFood', without: 'emptyStomach', any: 'anyTime' };

/** Up to 3 teach-back questions built from the cabinet. */
function buildQuiz(items, seed) {
  const sched = items.filter((m) => m.slots?.length);
  const qs = [];
  const pick = shuffle(sched, seed);
  if (pick[0]) {
    const right = slotKey(pick[0].slots);
    const opts = shuffle([right, ...shuffle(COMBOS.filter((c) => c !== right), seed + 1).slice(0, 2)], seed + 2);
    qs.push({ kind: 'when', med: pick[0], right, opts });
  }
  const foodMed = pick.find((m) => m.withFood && m.withFood !== 'any') || pick[1] || pick[0];
  if (foodMed) qs.push({ kind: 'food', med: foodMed, right: foodMed.withFood || 'any', opts: FOOD });
  const withPurpose = shuffle(items.filter((m) => m.purpose), seed + 3);
  if (withPurpose.length >= 2) {
    const [m, ...rest] = withPurpose;
    qs.push({ kind: 'what', med: m, right: m.id, opts: shuffle([m, ...rest.slice(0, 2)], seed + 4).map((x) => x.id) });
  } else if (pick[1]) {
    qs.push({ kind: 'when', med: pick[1], right: slotKey(pick[1].slots), opts: shuffle([slotKey(pick[1].slots), ...COMBOS.filter((c) => c !== slotKey(pick[1].slots)).slice(0, 2)], seed + 5) });
  }
  return qs;
}

export default function Quiz() {
  const { tr, lang, go } = useApp();
  const { items } = useCabinet();
  const [seed, setSeed] = useState(1);
  const [answers, setAnswers] = useState({});
  const quiz = useMemo(() => buildQuiz(items, seed), [items, seed]);
  const label = (q, o) => {
    if (q.kind === 'when') return o.split('+').map((s) => tr(s)).join(' + ');
    if (q.kind === 'food') return tr(FOOD_KEY[o]);
    return pl(items.find((m) => m.id === o)?.purpose, lang);
  };
  const question = (q) => tr(q.kind === 'when' ? 'qWhen' : q.kind === 'food' ? 'qFood' : 'qWhat', { name: q.med.name });
  const score = quiz.filter((q, i) => answers[i] === q.right).length;
  const done = quiz.length > 0 && Object.keys(answers).length === quiz.length;

  if (!quiz.length) {
    return (
      <div className="space-y-6">
        <h1 className="text-h2 md:text-h1">{tr('navQuiz')}</h1>
        <div className="grad-calm rounded-lg p-8">
          <p className="text-lead">{tr('quizEmpty')}</p>
          <Button className="mt-5" onClick={() => go('scan')}><ScanLine className="size-5" aria-hidden="true" />{tr('navScan')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="text-h2 md:text-h1">{tr('navQuiz')}</h1>
        <p className="mt-1 text-lead text-ink-2">{tr('quizIntro')}</p>
      </header>
      {quiz.map((q, i) => {
        const a = answers[i];
        return (
          <fieldset key={`${seed}-${i}`} className="rise rounded-lg border border-line bg-surface p-6" style={{ '--i': i }}>
            <legend className="sr-only">{question(q)}</legend>
            <p className="text-small font-semibold text-ink-2">{tr('questionN', { n: i + 1, total: quiz.length })}</p>
            <h2 className="mt-1 text-h3" aria-hidden="true">{question(q)}</h2>
            <div className="mt-4 grid gap-2">
              {q.opts.map((o) => {
                const chosen = a === o;
                const state = a == null ? '' : o === q.right ? 'border-safe bg-safe-soft' : chosen ? 'border-danger bg-danger-soft' : 'opacity-60';
                return (
                  <button key={o} type="button" disabled={a != null} onClick={() => setAnswers({ ...answers, [i]: o })} aria-pressed={chosen}
                    className={`btn flex items-center justify-between gap-3 rounded-md border border-control px-4 text-left text-body ${state}`}>
                    {label(q, o)}
                    {a != null && o === q.right && <Check className="size-5 text-safe" aria-label={tr('correct')} />}
                    {chosen && o !== q.right && <X className="size-5 text-danger" aria-label={tr('notQuite')} />}
                  </button>
                );
              })}
            </div>
            {a != null && (
              <div className={`pop mt-4 rounded-md p-4 ${a === q.right ? 'bg-safe-soft' : 'bg-caution-soft'}`} role="status">
                <p className="font-semibold">{tr(a === q.right ? 'correct' : 'notQuite')}</p>
                <p className="mt-1">{pl(q.med.plain, lang)}</p>
              </div>
            )}
          </fieldset>
        );
      })}
      {done && (
        <div className="flex flex-wrap items-center gap-4" role="status">
          <p className="text-h3">{tr('score', { n: score, total: quiz.length })}</p>
          <Button variant="secondary" onClick={() => { setSeed(seed + 1); setAnswers({}); }}><RotateCcw className="size-5" aria-hidden="true" />{tr('tryAgain')}</Button>
        </div>
      )}
    </div>
  );
}
