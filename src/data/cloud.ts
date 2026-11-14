/* Cloud backup transport: Supabase sign-in (email code) and one encrypted row per account.
   Only the encrypted envelope from core/backup.ts is ever sent. Nothing here runs unless the person
   turns on cloud backup. The sign-in session is kept in the encrypted local database. */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { SQLiteDatabase } from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { KdfParams } from '../core/backup';
import { BACKUP_KEY_NAME, getRaw, removeRaw, setRaw } from './db';

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const cloudConfigured = !!(URL && KEY);
const TABLE = 'cbt_backups';

let client: SupabaseClient | null = null;
export function cloud(db: SQLiteDatabase): SupabaseClient | null {
  if (!cloudConfigured) return null;
  if (!client) {
    client = createClient(URL!, KEY!, {
      auth: {
        storage: {
          getItem: (k) => getRaw(db, 'auth:' + k),
          setItem: (k, v) => setRaw(db, 'auth:' + k, v),
          removeItem: (k) => removeRaw(db, 'auth:' + k),
        },
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

export async function sendCode(c: SupabaseClient, email: string) {
  const { error } = await c.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } });
  if (error) throw error;
}
export async function verifyCode(c: SupabaseClient, email: string, code: string) {
  const { error } = await c.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
  if (error) throw error;
}
export async function currentUser(c: SupabaseClient) {
  const { data } = await c.auth.getSession();
  return data.session?.user ?? null;
}

export interface CloudRow { envelope: string; content_hash: string | null; updated_at: string; device: string | null }
export async function fetchBackup(c: SupabaseClient): Promise<CloudRow | null> {
  const { data, error } = await c.from(TABLE).select('envelope, content_hash, updated_at, device').maybeSingle();
  if (error) throw error;
  return data as CloudRow | null;
}
export async function uploadBackup(c: SupabaseClient, envelope: string, contentHash: string) {
  const user = await currentUser(c);
  if (!user) throw new Error('Not signed in');
  const updated_at = new Date().toISOString();
  const { error } = await c.from(TABLE).upsert(
    { user_id: user.id, envelope, content_hash: contentHash, device: Platform.OS, updated_at },
    { onConflict: 'user_id' });
  if (error) throw error;
  return updated_at;
}
export async function deleteBackup(c: SupabaseClient) {
  const user = await currentUser(c);
  if (!user) return;
  const { error } = await c.from(TABLE).delete().eq('user_id', user.id);
  if (error) throw error;
}

/* The derived key, kept in the Keychain / Keystore on this phone only. */
export interface SavedKey { key: string; kdf: KdfParams; user: string }
export async function loadKey(): Promise<SavedKey | null> {
  const s = await SecureStore.getItemAsync(BACKUP_KEY_NAME);
  try { return s ? JSON.parse(s) : null; } catch { return null; }
}
export async function saveKey(k: SavedKey) {
  await SecureStore.setItemAsync(BACKUP_KEY_NAME, JSON.stringify(k), { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY });
}
export async function forgetKey() {
  await SecureStore.deleteItemAsync(BACKUP_KEY_NAME);
}
