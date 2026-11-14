/* Encrypted cloud backup: pure logic, no React Native, no network.
   The backup is the same JSON as Export, encrypted on the phone with a key made from the person's
   passphrase (scrypt). The server only ever sees the envelope below: it cannot read the data.
   Cipher: XChaCha20-Poly1305 (authenticated: a wrong passphrase or a changed file fails to open). */
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { scryptAsync } from '@noble/hashes/scrypt.js';
import { exportData } from './cbt';
import { hash } from './quotes';
import type { AppData } from './types';

export interface KdfParams { name: 'scrypt'; N: number; r: number; p: number; salt: string }
export interface Envelope {
  app: 'CBT Practice Log backup';
  v: 1;
  alg: 'xchacha20poly1305';
  kdf: KdfParams;
  nonce: string;
  ct: string;
}
/* scrypt N=2^15, r=8: about 32 MB and one to a few seconds on a phone, once per device. */
export const DEFAULT_KDF = { name: 'scrypt' as const, N: 2 ** 15, r: 8, p: 1 };
export const MIN_PASSPHRASE = 10;

const enc = new TextEncoder();
/* TextDecoder may be missing on older Hermes; fall back to a plain UTF-8 decode. */
const dec = typeof TextDecoder !== 'undefined' ? new TextDecoder() : {
  decode(b: Uint8Array) {
    let s = '';
    for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
    return decodeURIComponent(escape(s));
  },
};

export function toB64(b: Uint8Array) {
  let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
}
export function fromB64(s: string) {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function passphraseProblem(p: string, repeat?: string): string | null {
  if (p.trim().length < MIN_PASSPHRASE) return `Use at least ${MIN_PASSPHRASE} characters. A short sentence works well.`;
  if (repeat !== undefined && p !== repeat) return 'The two passphrases are not the same.';
  return null;
}

/* The passphrase is normalized (NFC, trimmed), so the same words typed on another phone give the same key. */
export async function deriveKey(passphrase: string, kdf: KdfParams): Promise<Uint8Array> {
  return scryptAsync(enc.encode(passphrase.normalize('NFC').trim()), fromB64(kdf.salt), { N: kdf.N, r: kdf.r, p: kdf.p, dkLen: 32 });
}

const aad = (kdf: KdfParams) => enc.encode(`cbt-backup:v1:${kdf.name}:${kdf.N}:${kdf.r}:${kdf.p}:${kdf.salt}`);

/* random: a source of secure random bytes (expo-crypto on the phone). */
export function encryptBackup(plain: string, key: Uint8Array, kdf: KdfParams, random: (n: number) => Uint8Array): Envelope {
  const nonce = random(24);
  const ct = xchacha20poly1305(key, nonce, aad(kdf)).encrypt(enc.encode(plain));
  return { app: 'CBT Practice Log backup', v: 1, alg: 'xchacha20poly1305', kdf, nonce: toB64(nonce), ct: toB64(ct) };
}

export type OpenResult = { ok: true; text: string } | { ok: false; error: 'wrong-key' | 'bad-file' };
export function decryptBackup(env: Envelope, key: Uint8Array): OpenResult {
  let ct: Uint8Array, nonce: Uint8Array;
  try {
    ct = fromB64(env.ct);
    nonce = fromB64(env.nonce);
  } catch {
    return { ok: false, error: 'bad-file' };
  }
  try {
    return { ok: true, text: dec.decode(xchacha20poly1305(key, nonce, aad(env.kdf)).decrypt(ct)) };
  } catch {
    return { ok: false, error: 'wrong-key' };
  }
}

export function parseEnvelope(text: string): Envelope | null {
  try {
    const e = JSON.parse(text);
    const k = e?.kdf;
    if (e?.v !== 1 || e.alg !== 'xchacha20poly1305' || typeof e.nonce !== 'string' || typeof e.ct !== 'string') return null;
    if (k?.name !== 'scrypt' || typeof k.salt !== 'string' || ![k.N, k.r, k.p].every((n) => Number.isInteger(n) && n > 0)) return null;
    // Refuse settings that would freeze the phone (a changed file could ask for any N).
    if (k.N > 2 ** 20 || k.r > 16 || k.p > 4) return null;
    return e as Envelope;
  } catch {
    return null;
  }
}

export function newKdf(random: (n: number) => Uint8Array): KdfParams {
  return { ...DEFAULT_KDF, salt: toB64(random(16)) };
}

/* What goes in the backup: the Export file, so a restore uses the tested import path. */
export function backupPayload(d: AppData, quoteRatings: unknown[], now: number) {
  return JSON.stringify(exportData({ ...d, quoteRatings }, now));
}

/* A fingerprint of the content without the time stamp, to skip uploads when nothing changed. */
export function contentHash(payload: string) {
  return hash(payload.replace(/"exportedAt":"[^"]*",?/, '')).toString(36) + ':' + payload.length;
}
