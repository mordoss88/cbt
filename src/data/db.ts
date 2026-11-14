/* Local storage: one SQLite database on the phone, encrypted with SQLCipher.
   The key is made on first start and kept in the iOS Keychain / Android Keystore (expo-secure-store).
   Entries get their own rows; the rest are small JSON documents, the same shapes as the tracker's db docs. */
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { AppData, Ladder, LadderStep, ThoughtRecord } from '../core/types';
import { emptyQuoteState, type QuoteState } from '../core/quotes';

export const DB_NAME = 'cbtlog.db';
const KEY_NAME = 'cbtlog.dbkey.v1';
/* The cloud backup key (made from the passphrase), so backups run without typing it each time. */
export const BACKUP_KEY_NAME = 'cbtlog.backupkey.v1';
const DB_VERSION = 1;

export interface Settings {
  country: string | null;
  introSeen: boolean;
  /* The day the person tapped "Not today" on the Today task. */
  taskHiddenDay: string | null;
}
export const defaultSettings = (): Settings => ({ country: null, introSeen: false, taskHiddenDay: null });

async function dbKey() {
  let key = await SecureStore.getItemAsync(KEY_NAME);
  if (!key) {
    const bytes = Crypto.getRandomBytes(32);
    key = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    await SecureStore.setItemAsync(KEY_NAME, key, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY });
  }
  return key;
}

/* Runs first on every open (SQLiteProvider onInit): unlock, then migrate. */
export async function initDb(db: SQLiteDatabase) {
  const key = await dbKey();
  // The key is 64 hex characters from our own generator, never user input.
  await db.execAsync(`PRAGMA key = "x'${key}'"`);
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = row?.user_version ?? 0;
  if (version < 1) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY NOT NULL, json TEXT NOT NULL, when_ts INTEGER, updated_at TEXT);
      CREATE TABLE IF NOT EXISTS docs (key TEXT PRIMARY KEY NOT NULL, json TEXT NOT NULL);
    `);
  }
  await db.execAsync(`PRAGMA user_version = ${DB_VERSION}`);
}

type DocKey = 'ladder' | 'checkins' | 'tests' | 'coach' | 'chat' | 'quotes' | 'settings';

async function getDoc<T>(db: SQLiteDatabase, key: DocKey, fallback: T): Promise<T> {
  const row = await db.getFirstAsync<{ json: string }>('SELECT json FROM docs WHERE key = ?', key);
  if (!row) return fallback;
  try {
    return { ...fallback, ...JSON.parse(row.json) };
  } catch {
    return fallback;
  }
}
export async function setDoc(db: SQLiteDatabase, key: DocKey, value: unknown) {
  await db.runAsync('INSERT OR REPLACE INTO docs (key, json) VALUES (?, ?)', key, JSON.stringify(value));
}

const whenTs = (r: ThoughtRecord) => Date.parse(r.when ?? r.createdAt ?? '') || 0;

export async function putRecord(db: SQLiteDatabase, r: ThoughtRecord) {
  await db.runAsync('INSERT OR REPLACE INTO records (id, json, when_ts, updated_at) VALUES (?, ?, ?, ?)',
    r.id, JSON.stringify(r), whenTs(r), r.updatedAt ?? r.createdAt ?? null);
}
export async function deleteRecord(db: SQLiteDatabase, id: string) {
  await db.runAsync('DELETE FROM records WHERE id = ?', id);
}

export interface Loaded {
  data: AppData;
  quotes: QuoteState;
  settings: Settings;
}

export async function loadAll(db: SQLiteDatabase): Promise<Loaded> {
  const rows = await db.getAllAsync<{ json: string }>('SELECT json FROM records ORDER BY when_ts DESC');
  const records: ThoughtRecord[] = [];
  rows.forEach((r) => { try { records.push(JSON.parse(r.json)); } catch { /* skip a broken row */ } });
  const ladder = await getDoc<{ steps: LadderStep[]; ladders: Ladder[] }>(db, 'ladder', { steps: [], ladders: [] });
  const checkins = await getDoc(db, 'checkins', { entries: [] as AppData['checkins'] });
  const tests = await getDoc(db, 'tests', { results: [] as AppData['tests'] });
  const coach = await getDoc(db, 'coach', { notes: [] as AppData['notes'] });
  const chat = await getDoc(db, 'chat', { messages: [] as AppData['chat'] });
  const quotes = await getDoc<QuoteState>(db, 'quotes', emptyQuoteState());
  const settings = await getDoc<Settings>(db, 'settings', defaultSettings());
  return {
    data: { records, ladder: ladder.steps, ladders: ladder.ladders, checkins: checkins.entries, tests: tests.results, notes: coach.notes, chat: chat.messages },
    quotes,
    settings,
  };
}

/* Save everything except entries (entries are saved one by one). */
export async function saveDocs(db: SQLiteDatabase, data: AppData) {
  await setDoc(db, 'ladder', { steps: data.ladder, ladders: data.ladders });
  await setDoc(db, 'checkins', { entries: data.checkins });
  await setDoc(db, 'tests', { results: data.tests });
  await setDoc(db, 'coach', { notes: data.notes });
  await setDoc(db, 'chat', { messages: data.chat });
}

/* Replace all data in one transaction (import). */
export async function saveAll(db: SQLiteDatabase, data: AppData, quotes: QuoteState) {
  // withTransactionAsync, not the exclusive one: that opens a new connection without the SQLCipher key.
  const tx = db;
  await db.withTransactionAsync(async () => {
    await tx.runAsync('DELETE FROM records');
    for (const r of data.records) {
      await tx.runAsync('INSERT OR REPLACE INTO records (id, json, when_ts, updated_at) VALUES (?, ?, ?, ?)',
        r.id, JSON.stringify(r), whenTs(r), r.updatedAt ?? r.createdAt ?? null);
    }
    const put = (k: DocKey, v: unknown) => tx.runAsync('INSERT OR REPLACE INTO docs (key, json) VALUES (?, ?)', k, JSON.stringify(v));
    await put('ladder', { steps: data.ladder, ladders: data.ladders });
    await put('checkins', { entries: data.checkins });
    await put('tests', { results: data.tests });
    await put('coach', { notes: data.notes });
    await put('chat', { messages: data.chat });
    await put('quotes', quotes);
  });
}

export async function deleteEverything(db: SQLiteDatabase) {
  await db.execAsync('DELETE FROM records; DELETE FROM docs;');
  // Also forget the backup key and the sign-in (it was in docs). The cloud copy is deleted separately.
  await SecureStore.deleteItemAsync(BACKUP_KEY_NAME);
}

/* Raw text docs for the cloud backup: the Supabase sign-in session ("auth:" keys) and the backup state.
   They live in this encrypted database, not in plain storage. */
export async function getRaw(db: SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ json: string }>('SELECT json FROM docs WHERE key = ?', key);
  return row ? row.json : null;
}
export async function setRaw(db: SQLiteDatabase, key: string, value: string) {
  await db.runAsync('INSERT OR REPLACE INTO docs (key, json) VALUES (?, ?)', key, value);
}
export async function removeRaw(db: SQLiteDatabase, key: string) {
  await db.runAsync('DELETE FROM docs WHERE key = ?', key);
}
