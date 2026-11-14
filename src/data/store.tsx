/* App state. Everything is loaded from the local database at start (the data is small) and every change is saved at once.
   No network. */
import * as Crypto from 'expo-crypto';
import { useSQLiteContext } from 'expo-sqlite';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { DEFAULT_LADDER, guessCountry, ladderList } from '../core/cbt';
import { mergeImport } from '../core/migrate';
import { emptyQuoteState, rateQuote, type QuoteRating, type QuoteRatingEntry, type QuoteState } from '../core/quotes';
import { emptyData, type AppData, type Checkin, type Ladder, type LadderStep, type LadderTry, type TestResult, type ThoughtRecord } from '../core/types';
import { listenToWidget, pullWidgetRatings, pushWidget } from '../widgets/sync';
import * as DB from './db';

interface Store {
  ready: boolean;
  data: AppData;
  quotes: QuoteState;
  settings: DB.Settings;
  saveRecord(r: ThoughtRecord): Promise<ThoughtRecord>;
  removeRecord(id: string): Promise<void>;
  saveStep(s: Partial<LadderStep> & { text: string; rating: number }): Promise<LadderStep>;
  removeStep(id: string): Promise<void>;
  addTry(stepId: string, t: Omit<LadderTry, 'at'>): Promise<void>;
  setStepDone(stepId: string, done: boolean): Promise<void>;
  addLadder(name: string): Promise<Ladder>;
  renameLadder(id: string, name: string): Promise<void>;
  addCheckin(c: Omit<Checkin, 'at'>): Promise<void>;
  addTest(t: Omit<TestResult, 'at'>): Promise<void>;
  rate(id: string, rating: QuoteRating | null): Promise<void>;
  setSettings(s: Partial<DB.Settings>): Promise<void>;
  importData(inc: AppData, quoteRatings: QuoteRatingEntry[]): Promise<{ added: number; updated: number }>;
  deleteAll(): Promise<void>;
  syncWidget(): Promise<void>;
}

const Ctx = createContext<Store | null>(null);
export const newId = () => Crypto.randomUUID();
const nowIso = () => new Date().toISOString();

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<AppData>(emptyData);
  const [quotes, setQuotes] = useState<QuoteState>(emptyQuoteState);
  const [settings, setSettingsState] = useState<DB.Settings>(DB.defaultSettings);
  // Refs hold the newest values, so quick actions in a row never save an older copy.
  const dataRef = useRef(data);
  const quotesRef = useRef(quotes);

  const commitData = useCallback(async (next: AppData) => {
    dataRef.current = next;
    setData(next);
    await DB.saveDocs(db, next);
  }, [db]);
  const commitQuotes = useCallback(async (next: QuoteState) => {
    quotesRef.current = next;
    setQuotes(next);
    await DB.setDoc(db, 'quotes', next);
  }, [db]);

  const syncWidget = useCallback(async () => {
    const pulled = await pullWidgetRatings(quotesRef.current);
    const pushed = pushWidget(pulled.state);
    if (pushed !== quotesRef.current) await commitQuotes(pushed);
  }, [commitQuotes]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const loaded = await DB.loadAll(db);
      if (!alive) return;
      if (!loaded.settings.country) {
        loaded.settings.country = guessCountry(Intl.DateTimeFormat().resolvedOptions().timeZone);
      }
      dataRef.current = loaded.data;
      quotesRef.current = loaded.quotes;
      setData(loaded.data);
      setQuotes(loaded.quotes);
      setSettingsState(loaded.settings);
      setReady(true);
      await syncWidget();
    })();
    return () => { alive = false; };
  }, [db, syncWidget]);

  // Pick up widget ratings when the app comes back, and right away while it runs.
  useEffect(() => {
    if (!ready) return;
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') syncWidget(); });
    const stop = listenToWidget(() => { syncWidget(); });
    return () => { sub.remove(); stop(); };
  }, [ready, syncWidget]);

  const store = useMemo<Store>(() => ({
    ready, data, quotes, settings, syncWidget,

    async saveRecord(r) {
      const t = nowIso();
      const rec: ThoughtRecord = { ...r, id: r.id || newId(), createdAt: r.createdAt || t, updatedAt: t };
      await DB.putRecord(db, rec);
      const cur = dataRef.current;
      const records = [rec, ...cur.records.filter((x) => x.id !== rec.id)];
      dataRef.current = { ...cur, records };
      setData(dataRef.current);
      return rec;
    },
    async removeRecord(id) {
      await DB.deleteRecord(db, id);
      dataRef.current = { ...dataRef.current, records: dataRef.current.records.filter((r) => r.id !== id) };
      setData(dataRef.current);
    },
    async saveStep(s) {
      const cur = dataRef.current;
      const step: LadderStep = {
        tries: [], done: false, createdAt: nowIso(), ladder: s.ladder ?? ladderList(cur.ladders)[0].id,
        ...cur.ladder.find((x) => x.id === s.id), ...s, id: s.id || newId(),
      };
      const ladders = cur.ladders.length ? cur.ladders : [{ ...DEFAULT_LADDER }];
      await commitData({ ...cur, ladders, ladder: [...cur.ladder.filter((x) => x.id !== step.id), step] });
      return step;
    },
    async removeStep(id) {
      const cur = dataRef.current;
      await commitData({ ...cur, ladder: cur.ladder.filter((s) => s.id !== id) });
    },
    async addTry(stepId, t) {
      const cur = dataRef.current;
      await commitData({ ...cur, ladder: cur.ladder.map((s) => (s.id === stepId ? { ...s, tries: [...(s.tries || []), { ...t, at: nowIso() }] } : s)) });
    },
    async setStepDone(stepId, done) {
      const cur = dataRef.current;
      await commitData({ ...cur, ladder: cur.ladder.map((s) => (s.id === stepId ? { ...s, done } : s)) });
    },
    async addLadder(name) {
      const cur = dataRef.current;
      const l = { id: newId(), name: name.trim() || 'New ladder' };
      await commitData({ ...cur, ladders: [...ladderList(cur.ladders), l] });
      return l;
    },
    async renameLadder(id, name) {
      const cur = dataRef.current;
      await commitData({ ...cur, ladders: ladderList(cur.ladders).map((l) => (l.id === id ? { ...l, name: name.trim() || l.name } : l)) });
    },
    async addCheckin(c) {
      const cur = dataRef.current;
      await commitData({ ...cur, checkins: [...cur.checkins, { ...c, at: nowIso() }] });
    },
    async addTest(t) {
      const cur = dataRef.current;
      await commitData({ ...cur, tests: [...cur.tests, { ...t, at: nowIso() }] });
    },
    async rate(id, rating) {
      await commitQuotes(rateQuote(quotesRef.current, id, rating, nowIso(), 'app'));
      pushWidget(quotesRef.current);
    },
    async setSettings(s) {
      const next = { ...settings, ...s };
      setSettingsState(next);
      await DB.setDoc(db, 'settings', next);
    },
    async importData(inc, quoteRatings) {
      const { data: merged, summary } = mergeImport(dataRef.current, inc);
      let q = quotesRef.current;
      quoteRatings.forEach((r) => { q = rateQuote(q, r.id, r.rating, r.at, r.from); });
      await DB.saveAll(db, merged, q);
      dataRef.current = merged;
      quotesRef.current = q;
      setData(merged);
      setQuotes(q);
      return summary;
    },
    async deleteAll() {
      await DB.deleteEverything(db);
      dataRef.current = emptyData();
      quotesRef.current = emptyQuoteState();
      setData(dataRef.current);
      setQuotes(quotesRef.current);
      setSettingsState(DB.defaultSettings());
      pushWidget(quotesRef.current);
    },
  }), [ready, data, quotes, settings, db, commitData, commitQuotes, syncWidget]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}
