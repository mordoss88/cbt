import { randomBytes } from 'crypto';
import {
  backupPayload, contentHash, decryptBackup, deriveKey, encryptBackup, fromB64, newKdf, parseEnvelope, passphraseProblem, toB64,
  type KdfParams,
} from '../src/core/backup';
import { mergeImport, parseTrackerExport } from '../src/core/migrate';
import { emptyData, type AppData } from '../src/core/types';

const random = (n: number) => new Uint8Array(randomBytes(n));
// Small scrypt cost so the tests are fast; the app uses DEFAULT_KDF.
const fastKdf = (): KdfParams => ({ ...newKdf(random), N: 1024 });

const data: AppData = {
  ...emptyData(),
  records: [{ id: 'r1', kind: 'record', when: '2026-11-10T08:00:00.000Z', situation: 'Stand-up call – “ćao”', anxietyBefore: 70, sensations: [], safety: [], traps: ['mind'],
    createdAt: '2026-11-10T08:05:00.000Z', updatedAt: '2026-11-10T20:00:00.000Z' }],
  ladders: [{ id: 'drive', name: 'Driving' }],
  ladder: [{ id: 's1', text: 'Sit in the driver seat', rating: 10, ladder: 'drive', done: true, createdAt: '2026-11-01', tries: [] }],
};
const ratings = [{ id: 'q01', rating: 'up', at: '2026-11-14T08:00:00.000Z', from: 'widget' }];

describe('backup crypto', () => {
  test('base64 round trip, also for large data', () => {
    const b = random(200_000);
    expect(fromB64(toB64(b))).toEqual(b);
  });

  test('encrypts and opens with the same passphrase, and restores through the import path', async () => {
    const kdf = fastKdf();
    const key = await deriveKey('driving with Dad on field roads', kdf);
    const payload = backupPayload(data, ratings, Date.parse('2026-11-14T21:00:00Z'));
    const env = encryptBackup(payload, key, kdf, random);
    expect(env.ct).not.toContain('Stand-up');
    expect(JSON.stringify(env)).not.toContain('Driving');

    const parsed = parseEnvelope(JSON.stringify(env));
    expect(parsed).not.toBeNull();
    // Another phone: same words, key made again from the salt in the envelope.
    const key2 = await deriveKey('  driving with Dad on field roads ', parsed!.kdf);
    const opened = decryptBackup(parsed!, key2);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;
    const imp = parseTrackerExport(opened.text);
    expect(imp.ok).toBe(true);
    if (!imp.ok) return;
    expect(imp.data.records[0].situation).toBe('Stand-up call – “ćao”');
    expect(imp.quoteRatings).toHaveLength(1);
    const merged = mergeImport(emptyData(), imp.data);
    expect(merged.data.ladder).toHaveLength(1);
    // Restoring twice makes no copies.
    expect(mergeImport(merged.data, imp.data).summary.added).toBe(0);
  });

  test('a wrong passphrase or a changed file does not open', async () => {
    const kdf = fastKdf();
    const env = encryptBackup('{"a":1}', await deriveKey('the right passphrase', kdf), kdf, random);
    expect(decryptBackup(env, await deriveKey('the wrong passphrase', kdf))).toEqual({ ok: false, error: 'wrong-key' });
    const key = await deriveKey('the right passphrase', kdf);
    const ct = fromB64(env.ct);
    ct[3] ^= 1;
    expect(decryptBackup({ ...env, ct: toB64(ct) }, key).ok).toBe(false);
    // Changing the kdf settings in the header also breaks it (they are authenticated).
    expect(decryptBackup({ ...env, kdf: { ...env.kdf, N: 2048 } }, key).ok).toBe(false);
  });

  test('each backup uses a new nonce', async () => {
    const kdf = fastKdf();
    const key = await deriveKey('the right passphrase', kdf);
    expect(encryptBackup('x', key, kdf, random).nonce).not.toBe(encryptBackup('x', key, kdf, random).nonce);
  });

  test('parseEnvelope refuses junk and costly settings', () => {
    expect(parseEnvelope('nope')).toBeNull();
    expect(parseEnvelope('{"v":1}')).toBeNull();
    const ok = { app: 'CBT Practice Log backup', v: 1, alg: 'xchacha20poly1305', nonce: 'AA==', ct: 'AA==', kdf: { name: 'scrypt', N: 1024, r: 8, p: 1, salt: 'AA==' } };
    expect(parseEnvelope(JSON.stringify(ok))).not.toBeNull();
    expect(parseEnvelope(JSON.stringify({ ...ok, kdf: { ...ok.kdf, N: 2 ** 24 } }))).toBeNull();
  });
});

describe('backup helpers', () => {
  test('passphrase rules', () => {
    expect(passphraseProblem('short')).toMatch(/at least/);
    expect(passphraseProblem('a long enough one', 'a long enough two')).toMatch(/not the same/);
    expect(passphraseProblem('a long enough one', 'a long enough one')).toBeNull();
  });

  test('content hash ignores the export time but sees changes', () => {
    const a = backupPayload(data, ratings, 1);
    const b = backupPayload(data, ratings, 2);
    const c = backupPayload({ ...data, ladder: [] }, ratings, 1);
    expect(contentHash(a)).toBe(contentHash(b));
    expect(contentHash(a)).not.toBe(contentHash(c));
  });
});
