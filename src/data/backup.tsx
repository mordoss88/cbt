/* Cloud backup state for the app: sign in with an email code, set a passphrase, back up and restore.
   Offline-first: the app never waits for the cloud. Backups run when asked and when the app goes to
   the background, only if something changed. A restore merges, so nothing on the phone is lost. */
import * as Crypto from 'expo-crypto';
import { useSQLiteContext } from 'expo-sqlite';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  backupPayload, contentHash, decryptBackup, deriveKey, encryptBackup, fromB64, newKdf, parseEnvelope, passphraseProblem, toB64,
} from '../core/backup';
import { parseTrackerExport } from '../core/migrate';
import * as Cloud from './cloud';
import { getRaw, setRaw } from './db';
import { useStore } from './store';

export type BackupPhase = 'loading' | 'off' | 'signed-out' | 'need-passphrase' | 'ready';
interface BackupState { lastHash: string | null; lastAt: string | null; auto: boolean }
const STATE_KEY = 'backup:state';
const defaultState = (): BackupState => ({ lastHash: null, lastAt: null, auto: true });
const random = (n: number) => Crypto.getRandomBytes(n);

interface Backup {
  phase: BackupPhase;
  email: string | null;
  cloudHasBackup: boolean;
  lastAt: string | null;
  auto: boolean;
  busy: string | null;
  error: string | null;
  sendCode(email: string): Promise<boolean>;
  verifyCode(email: string, code: string): Promise<void>;
  createPassphrase(p: string, repeat: string): Promise<void>;
  unlock(p: string): Promise<{ added: number; updated: number } | null>;
  backupNow(): Promise<void>;
  restore(): Promise<{ added: number; updated: number } | null>;
  setAuto(on: boolean): Promise<void>;
  signOut(): Promise<void>;
  deleteCloud(): Promise<void>;
}

const Ctx = createContext<Backup | null>(null);

function message(e: unknown) {
  const m = e instanceof Error ? e.message : String(e);
  if (/network|fetch/i.test(m)) return 'No connection. Your data is safe on the phone. Try again later.';
  if (/expired|invalid/i.test(m) && /otp|token/i.test(m)) return 'That code did not work. Ask for a new one.';
  return m;
}

export function BackupProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const { ready, data, quotes, importData } = useStore();
  const c = useMemo(() => Cloud.cloud(db), [db]);
  const [phase, setPhase] = useState<BackupPhase>(c ? 'loading' : 'off');
  const [email, setEmail] = useState<string | null>(null);
  const [cloudHasBackup, setCloudHasBackup] = useState(false);
  const [state, setState] = useState<BackupState>(defaultState);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // The newest values for callbacks that run later (upload when the app goes to the background).
  const latest = useRef({ data, quotes, state, phase });
  useEffect(() => { latest.current = { data, quotes, state, phase }; }, [data, quotes, state, phase]);

  const saveState = useCallback(async (s: BackupState) => {
    setState(s);
    latest.current.state = s;
    await setRaw(db, STATE_KEY, JSON.stringify(s));
  }, [db]);

  const refresh = useCallback(async () => {
    if (!c) return; // the phase is 'off' from the start
    try {
      const raw = await getRaw(db, STATE_KEY);
      const s = raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState();
      setState(s);
      latest.current.state = s;
    } catch { /* keep defaults */ }
    const user = await Cloud.currentUser(c);
    if (!user) { setEmail(null); return setPhase('signed-out'); }
    setEmail(user.email ?? null);
    const key = await Cloud.loadKey();
    if (key && key.user === user.id) return setPhase('ready');
    try {
      setCloudHasBackup(!!(await Cloud.fetchBackup(c)));
    } catch (e) { setError(message(e)); }
    setPhase('need-passphrase');
  }, [c, db]);

  useEffect(() => {
    (async () => { await refresh(); })();
  }, [refresh]);

  const run = useCallback(async <T,>(label: string, f: () => Promise<T>): Promise<T | null> => {
    setBusy(label);
    setError(null);
    try { return await f(); } catch (e) { setError(message(e)); return null; } finally { setBusy(null); }
  }, []);

  const upload = useCallback(async (force: boolean) => {
    if (!c) return;
    const key = await Cloud.loadKey();
    if (!key) return;
    const { data: d, quotes: q, state: s } = latest.current;
    const payload = backupPayload(d, Object.values(q.ratings), Date.now());
    const h = contentHash(payload);
    if (!force && h === s.lastHash) return;
    const env = encryptBackup(payload, fromB64(key.key), key.kdf, random);
    const at = await Cloud.uploadBackup(c, JSON.stringify(env), h);
    await saveState({ ...latest.current.state, lastHash: h, lastAt: at });
  }, [c, saveState]);

  const openCloud = useCallback(async (keyBytes?: Uint8Array) => {
    if (!c) throw new Error('Cloud backup is not set up in this build.');
    const row = await Cloud.fetchBackup(c);
    if (!row) return null;
    const env = parseEnvelope(row.envelope);
    if (!env) throw new Error('The backup in the cloud cannot be read by this version of the app.');
    return { env, opened: keyBytes ? decryptBackup(env, keyBytes) : null };
  }, [c]);

  const merge = useCallback(async (text: string) => {
    const imp = parseTrackerExport(text);
    if (!imp.ok) throw new Error(imp.error);
    return importData(imp.data, imp.quoteRatings);
  }, [importData]);

  // Back up when the app goes to the background, if something changed.
  useEffect(() => {
    if (!ready) return;
    const sub = AppState.addEventListener('change', (s) => {
      const l = latest.current;
      if (s === 'background' && l.phase === 'ready' && l.state.auto) upload(false).catch(() => { /* try again next time */ });
    });
    return () => sub.remove();
  }, [ready, upload]);

  const value = useMemo<Backup>(() => ({
    phase, email, cloudHasBackup, lastAt: state.lastAt, auto: state.auto, busy, error,

    async sendCode(addr) {
      return (await run('Sending the code…', async () => { await Cloud.sendCode(c!, addr); return true; })) ?? false;
    },
    async verifyCode(addr, code) {
      await run('Checking the code…', async () => { await Cloud.verifyCode(c!, addr, code); await refresh(); });
    },
    async createPassphrase(p, repeat) {
      const problem = passphraseProblem(p, repeat);
      if (problem) { setError(problem); return; }
      await run('Making your key. This takes a few seconds…', async () => {
        const user = await Cloud.currentUser(c!);
        if (!user) throw new Error('Sign in first.');
        // Never replace an existing backup with a new passphrase by mistake (for example on a new, empty phone).
        if (await Cloud.fetchBackup(c!)) {
          setCloudHasBackup(true);
          throw new Error('You already have a backup. Enter its passphrase to open it.');
        }
        const kdf = newKdf(random);
        const key = await deriveKey(p, kdf);
        await Cloud.saveKey({ key: toB64(key), kdf, user: user.id });
        await upload(true);
        setPhase('ready');
      });
    },
    async unlock(p) {
      return run('Opening your backup. This takes a few seconds…', async () => {
        const user = await Cloud.currentUser(c!);
        if (!user) throw new Error('Sign in first.');
        const found = await openCloud();
        if (!found) throw new Error('There is no backup in the cloud yet.');
        const key = await deriveKey(p, found.env.kdf);
        const opened = decryptBackup(found.env, key);
        if (!opened.ok) throw new Error('That passphrase does not open your backup. Check it and try again.');
        await Cloud.saveKey({ key: toB64(key), kdf: found.env.kdf, user: user.id });
        const summary = await merge(opened.text);
        setPhase('ready');
        await upload(false);
        return summary;
      });
    },
    async backupNow() {
      await run('Backing up…', () => upload(true));
    },
    async restore() {
      return run('Restoring…', async () => {
        const key = await Cloud.loadKey();
        if (!key) throw new Error('Set your passphrase first.');
        const found = await openCloud(fromB64(key.key));
        if (!found) throw new Error('There is no backup in the cloud yet.');
        if (!found.opened?.ok) {
          // The passphrase was changed on another phone.
          await Cloud.forgetKey();
          setCloudHasBackup(true);
          setPhase('need-passphrase');
          throw new Error('The backup now uses another passphrase. Enter it to open the backup.');
        }
        return merge(found.opened.text);
      });
    },
    async setAuto(on) {
      await saveState({ ...latest.current.state, auto: on });
    },
    async signOut() {
      await run('Signing out…', async () => {
        await Cloud.forgetKey();
        await c?.auth.signOut();
        await saveState(defaultState());
        await refresh();
      });
    },
    async deleteCloud() {
      await run('Deleting the cloud backup…', async () => {
        await Cloud.deleteBackup(c!);
        await Cloud.forgetKey();
        await saveState({ ...latest.current.state, lastHash: null, lastAt: null });
        setCloudHasBackup(false);
        setPhase('need-passphrase');
      });
    },
  }), [phase, email, cloudHasBackup, state, busy, error, c, run, refresh, upload, openCloud, merge, saveState]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBackup() {
  const b = useContext(Ctx);
  if (!b) throw new Error('useBackup outside BackupProvider');
  return b;
}
