import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import * as cabinet from '../lib/cabinet.js';
import { checkInteractions } from '../lib/openfda.js';

export const AppCtx = createContext(null);
/** { lang, setLang, senior, setSenior, tr, go, raw, setRaw, openFridge, openAuth } */
export const useApp = () => useContext(AppCtx);

export const useCabinet = () => useSyncExternalStore(cabinet.subscribe, cabinet.getSnapshot);

const onHash = (fn) => {
  window.addEventListener('hashchange', fn);
  return () => window.removeEventListener('hashchange', fn);
};
export const useHash = () => useSyncExternalStore(onHash, () => window.location.hash);

/** Safety check for the current cabinet; re-runs when the set of generics changes. */
export function useInteractions(items) {
  const key = [...new Set(items.map((i) => i.generic).filter(Boolean))].sort().join(',');
  const [res, setRes] = useState({ key: null, data: null });
  useEffect(() => {
    let alive = true;
    const meds = key ? key.split(',').map((g) => {
      const it = items.find((i) => i.generic === g);
      return { name: it?.name || g, generic: g };
    }) : [];
    checkInteractions(meds).then((data) => alive && setRes({ key, data }));
    return () => { alive = false; };
    // items only matter through `key`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return res.key === key ? res.data : null; // null while loading
}

/** Ticks every `ms` so countdowns stay fresh. */
export function useNow(ms = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}
