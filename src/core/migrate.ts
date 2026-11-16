/* Import from the tracker: read its Export file (format 2, or the older format 1 without ladders),
   check it, and merge it into the app's data. Importing the same file twice changes nothing. */
import { ladderList } from './cbt';
import type { AppData, ChatMessage, Checkin, CoachNote, Ladder, LadderStep, LadderTry, TestResult, ThoughtRecord } from './types';
import type { QuoteRatingEntry } from './quotes';
import { hash } from './quotes';

export interface ImportCounts {
  records: number;
  journal: number;
  steps: number;
  ladders: number;
  checkins: number;
  tests: number;
  notes: number;
  chat: number;
  quoteRatings: number;
}
export type ParseResult =
  | { ok: true; data: AppData; quoteRatings: QuoteRatingEntry[]; counts: ImportCounts; exportedAt: string | null; warnings: string[] }
  | { ok: false; error: string };

const isObj = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const arr = (v: unknown): any[] => (Array.isArray(v) ? v : []);
const str = (v: unknown) => (typeof v === 'string' ? v : undefined);
const validDate = (v: unknown) => typeof v === 'string' && !isNaN(Date.parse(v));
const rating = (v: unknown) => (typeof v === 'number' && isFinite(v) ? Math.max(0, Math.min(100, Math.round(v))) : null);
const strList = (v: unknown) => arr(v).filter((x) => typeof x === 'string');

/* A stable id for an item that has none, so a second import finds the same item. */
function stableId(prefix: string, o: unknown) {
  return prefix + '-' + hash(JSON.stringify(o)).toString(36);
}

function cleanRecord(r: Record<string, any>): ThoughtRecord {
  const out: ThoughtRecord = { ...r, id: str(r.id) || stableId('r', r) };
  out.kind = r.kind === 'journal' ? 'journal' : r.kind === 'record' ? 'record' : undefined;
  if (!out.kind) delete out.kind;
  for (const k of ['anxietyBefore', 'anxietyAfter', 'beliefBefore', 'beliefAfter'] as const) {
    if (k in r) out[k] = rating(r[k]);
  }
  for (const k of ['sensations', 'safety', 'traps'] as const) {
    if (k in r) out[k] = strList(r[k]);
  }
  return out;
}
function cleanTry(t: Record<string, any>): LadderTry {
  return { ...t, at: t.at, peak: rating(t.peak) };
}
function cleanStep(s: Record<string, any>): LadderStep | null {
  const text = str(s.text)?.trim();
  if (!text) return null;
  const out: LadderStep = { ...s, id: str(s.id) || stableId('s', s), text, rating: rating(s.rating) ?? 0, done: !!s.done,
    tries: arr(s.tries).filter((t) => isObj(t) && validDate(t.at)).map(cleanTry) };
  return out;
}

/* Find the export in pasted or saved text. Copying on a phone can add a BOM, a few words or a code fence
   around it, and some keyboards turn the copied spaces into non-breaking ones. */
export function extractExportJson(text: string): string | null {
  const t = String(text ?? '').replace(/^\uFEFF/, '').trim();
  if (!t) return null;
  if (t.startsWith('{')) {
    try { JSON.parse(t); return t; } catch { /* look for the object below */ }
  }
  const start = t.indexOf('{'), end = t.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  const inner = t.slice(start, end + 1);
  for (const candidate of [inner, inner.replace(/\u00A0/g, ' ')]) {
    try { JSON.parse(candidate); return candidate; } catch { /* try the next one */ }
  }
  return null;
}

export function parseTrackerExport(text: string): ParseResult {
  let o: unknown;
  const json = extractExportJson(text);
  if (!json) {
    return String(text ?? '').trim()
      ? { ok: false, error: 'This is not a whole CBT Practice Log export. Copy all of it in the tracker (Copy all my data) and paste again.' }
      : { ok: false, error: 'Nothing to import yet. Paste the text from the tracker first.' };
  }
  try {
    o = JSON.parse(json);
  } catch {
    return { ok: false, error: 'This file is not a CBT Practice Log export. Use Export in the tracker and pick that file.' };
  }
  if (!isObj(o)) return { ok: false, error: 'This file is not a CBT Practice Log export.' };
  if (o.app !== undefined && o.app !== 'CBT Practice Log') return { ok: false, error: 'This export is from another app.' };
  const format = o.format === undefined ? 1 : Number(o.format);
  if (format > 2) return { ok: false, error: 'This export is from a newer version. Update the app, then try again.' };
  if (!Array.isArray(o.records) && !Array.isArray(o.ladder)) return { ok: false, error: 'This file has no entries or ladder steps.' };

  const warnings: string[] = [];
  const rawRecords = arr(o.records);
  const records = rawRecords.filter(isObj).map(cleanRecord);
  if (records.length < rawRecords.length) warnings.push(`${rawRecords.length - records.length} broken entries were skipped.`);

  /* The tracker's ladder doc can come as a steps array (export) or as { steps, ladders }. */
  const ladderSrc = isObj(o.ladder) ? o.ladder : null;
  const rawSteps = ladderSrc ? arr(ladderSrc.steps) : arr(o.ladder);
  const steps = rawSteps.filter(isObj).map(cleanStep).filter((s): s is LadderStep => !!s);
  if (steps.length < rawSteps.length) warnings.push(`${rawSteps.length - steps.length} ladder steps without text were skipped.`);
  const ladders: Ladder[] = arr(ladderSrc?.ladders ?? o.ladders)
    .filter((l) => isObj(l) && str(l.id))
    .map((l) => ({ id: l.id, name: str(l.name)?.trim() || 'My ladder' }));

  const checkins: Checkin[] = arr(o.checkins).filter((c) => isObj(c) && validDate(c.at));
  const tests: TestResult[] = arr(o.tests).filter((t) => isObj(t) && str(t.test) && validDate(t.at));
  const notes: CoachNote[] = arr(o.coachNotes ?? o.notes).filter((n) => isObj(n) && str(n.text))
    .map((n) => ({ ...n, id: str(n.id) || stableId('n', n), text: n.text }));
  const chat: ChatMessage[] = arr(o.chat).filter((m) => isObj(m) && (m.role === 'user' || m.role === 'assistant') && str(m.text));
  const quoteRatings: QuoteRatingEntry[] = arr(o.quoteRatings)
    .filter((q) => isObj(q) && str(q.id) && (q.rating === 'up' || q.rating === 'down') && validDate(q.at));

  const data: AppData = { records, ladders: ladders.length ? ladderList(ladders) : [], ladder: steps, checkins, tests, notes, chat };
  return {
    ok: true, data, quoteRatings, warnings,
    exportedAt: validDate(o.exportedAt) ? o.exportedAt : null,
    counts: {
      records: records.filter((r) => r.kind !== 'journal').length,
      journal: records.filter((r) => r.kind === 'journal').length,
      steps: steps.length, ladders: data.ladders.length, checkins: checkins.length, tests: tests.length,
      notes: notes.length, chat: chat.length, quoteRatings: quoteRatings.length,
    },
  };
}

const newer = (a?: string, b?: string) => (Date.parse(a ?? '') || 0) > (Date.parse(b ?? '') || 0);

function mergeBy<T>(cur: T[], inc: T[], key: (x: T) => string, pick: (a: T, b: T) => T = (a) => a) {
  const map = new Map<string, T>();
  cur.forEach((x) => map.set(key(x), x));
  let added = 0;
  let updated = 0;
  inc.forEach((x) => {
    const k = key(x);
    const have = map.get(k);
    if (!have) { map.set(k, x); added++; return; }
    const next = pick(have, x);
    if (next !== have) { map.set(k, next); updated++; }
  });
  return { list: Array.from(map.values()), added, updated };
}

/* Merge imported data into the app's data. Nothing in the app is deleted.
   - Entries: same id → the one updated last wins.
   - Ladder steps: same id → tries are joined (by time), "done" stays done.
   - Check-ins, self-checks, notes and chat: added when new. */
export function mergeImport(cur: AppData, inc: AppData) {
  const records = mergeBy(cur.records, inc.records, (r) => r.id,
    (a, b) => (newer(b.updatedAt ?? b.createdAt, a.updatedAt ?? a.createdAt) ? b : a));
  const ladder = mergeBy(cur.ladder, inc.ladder, (s) => s.id, (a, b) => {
    const tries = mergeBy(a.tries || [], b.tries || [], (t) => t.at).list.sort((x, y) => Date.parse(x.at) - Date.parse(y.at));
    const done = !!(a.done || b.done);
    if (tries.length === (a.tries || []).length && done === !!a.done) return a;
    return { ...a, tries, done };
  });
  const ladders = mergeBy(cur.ladders, inc.ladders, (l) => l.id);
  const checkins = mergeBy(cur.checkins, inc.checkins, (c) => c.at);
  const tests = mergeBy(cur.tests, inc.tests, (t) => t.test + '@' + t.at);
  const notes = mergeBy(cur.notes, inc.notes, (n) => n.id);
  const chat = mergeBy(cur.chat, inc.chat, (m) => m.id || `${m.role}@${m.createdAt}@${m.text.slice(0, 40)}`);
  return {
    data: {
      records: records.list, ladder: ladder.list, ladders: ladders.list, checkins: checkins.list,
      tests: tests.list, notes: notes.list, chat: chat.list,
    } as AppData,
    summary: {
      added: records.added + ladder.added + ladders.added + checkins.added + tests.added + notes.added + chat.added,
      updated: records.updated + ladder.updated,
      records: records.added, steps: ladder.added,
    },
  };
}
