import { mergeImport, parseTrackerExport } from '../src/core/migrate';
import { exportData } from '../src/core/cbt';
import { emptyData } from '../src/core/types';

/* A small export in the tracker's format 2, like the file its Export button saves. */
const trackerExport = {
  app: 'CBT Practice Log', format: 2, exportedAt: '2026-11-13T20:00:00.000Z',
  records: [
    { id: 'r1', when: '2026-11-10T08:00:00.000Z', situation: 'Stand-up call', anxietyBefore: 70, sensations: ['Heart racing'], thought: 'They think I am slow',
      beliefBefore: 80, safety: ['Rehearsed what to say'], traps: ['mind'], balanced: 'They were busy.', anxietyAfter: 35,
      createdAt: '2026-11-10T08:05:00.000Z', updatedAt: '2026-11-10T20:00:00.000Z' },
    { id: 'j1', kind: 'journal', when: '2026-11-11T21:00:00.000Z', text: 'A calm evening drive with Dad.', createdAt: '2026-11-11T21:00:00.000Z' },
    { id: 'r2', when: '2026-11-12T09:00:00.000Z', anxietyBefore: 140, createdAt: '2026-11-12T09:00:00.000Z' },
    'broken',
  ],
  ladders: [{ id: 'main', name: 'Social' }, { id: 'drive', name: 'Driving' }],
  ladder: [
    { id: 's1', text: 'Sit in the driver seat, engine off', rating: 10, ladder: 'drive', done: true, createdAt: '2026-11-01',
      tries: [{ at: '2026-11-02T10:00:00.000Z', peak: 5, predicted: 'Panic', happened: 'Fine' }, { at: 'bad' }] },
    { id: 's2', text: 'Drive on a field road with Dad', rating: 30, ladder: 'drive', createdAt: '2026-11-01', tries: [] },
    { id: 's3', text: '  ', rating: 40 },
  ],
  checkins: [{ at: '2026-11-08T09:00:00.000Z', anxiety: 5, interfere: 4, avoid: 3 }],
  tests: [{ test: 'gad7', at: '2026-11-01T09:00:00.000Z', answers: [1, 1, 1, 1, 1, 1, 1], score: 7, band: 'mild' }],
  coachNotes: [{ id: 'n1', text: 'Practises driving with Dad on field roads.', createdAt: '2026-10-24T10:00:00.000Z' }],
  chat: [{ id: 'm1', role: 'user', text: 'What did I feel last week?', createdAt: '2026-11-12T10:00:00.000Z' }],
};

describe('parseTrackerExport', () => {
  test('reads a format 2 export and counts what is in it', () => {
    const r = parseTrackerExport(JSON.stringify(trackerExport));
    if (!r.ok) throw new Error(r.error);
    expect(r.counts).toEqual({ records: 2, journal: 1, steps: 2, ladders: 2, checkins: 1, tests: 1, notes: 1, chat: 1, quoteRatings: 0 });
    expect(r.exportedAt).toBe('2026-11-13T20:00:00.000Z');
    expect(r.warnings).toEqual(['1 broken entries were skipped.', '1 ladder steps without text were skipped.']);
  });

  test('keeps every field of an entry and clamps ratings to 0-100', () => {
    const r = parseTrackerExport(JSON.stringify(trackerExport));
    if (!r.ok) throw new Error(r.error);
    const r1 = r.data.records.find((x) => x.id === 'r1')!;
    expect(r1.thought).toBe('They think I am slow');
    expect(r1.traps).toEqual(['mind']);
    expect(r1.anxietyAfter).toBe(35);
    expect(r.data.records.find((x) => x.id === 'r2')!.anxietyBefore).toBe(100);
    expect(r.data.records.find((x) => x.id === 'j1')!.kind).toBe('journal');
  });

  test('keeps ladder ids and drops tries without a valid time', () => {
    const r = parseTrackerExport(JSON.stringify(trackerExport));
    if (!r.ok) throw new Error(r.error);
    const s1 = r.data.ladder.find((s) => s.id === 's1')!;
    expect(s1.ladder).toBe('drive');
    expect(s1.done).toBe(true);
    expect(s1.tries).toHaveLength(1);
    expect(r.data.ladders.map((l) => l.name)).toEqual(['Social', 'Driving']);
  });

  test('reads the older format 1 (no ladders list, notes key) and the app\'s own export', () => {
    const v1 = { records: [{ id: 'a', situation: 'x' }], ladder: [{ id: 's', text: 'Step', rating: 20 }], notes: [{ id: 'n', text: 'note' }] };
    const r = parseTrackerExport(JSON.stringify(v1));
    if (!r.ok) throw new Error(r.error);
    expect(r.counts.notes).toBe(1);
    expect(r.data.ladders).toEqual([]);
    const own = exportData({ records: [{ id: 'z' }], quoteRatings: [{ id: 'q01', rating: 'up', at: '2026-11-14T00:00:00Z' }] }, Date.now());
    const r2 = parseTrackerExport(JSON.stringify(own));
    if (!r2.ok) throw new Error(r2.error);
    expect(r2.quoteRatings).toHaveLength(1);
  });

  test('gives a clear error for files that are not an export', () => {
    expect(parseTrackerExport('not json')).toMatchObject({ ok: false });
    expect(parseTrackerExport('[]')).toMatchObject({ ok: false });
    expect(parseTrackerExport('{"app":"Other app","records":[]}')).toMatchObject({ ok: false, error: 'This export is from another app.' });
    expect(parseTrackerExport('{"app":"CBT Practice Log","format":3,"records":[]}')).toMatchObject({ ok: false });
    expect(parseTrackerExport('{"app":"CBT Practice Log","format":2}')).toMatchObject({ ok: false });
  });

  test('items without an id get the same id on every import', () => {
    const f = JSON.stringify({ records: [{ situation: 'no id', when: '2026-11-01T00:00:00Z' }], ladder: [] });
    const a = parseTrackerExport(f);
    const b = parseTrackerExport(f);
    if (!a.ok || !b.ok) throw new Error('parse');
    expect(a.data.records[0].id).toBe(b.data.records[0].id);
  });
});

describe('mergeImport', () => {
  const parsed = () => {
    const r = parseTrackerExport(JSON.stringify(trackerExport));
    if (!r.ok) throw new Error(r.error);
    return r.data;
  };

  test('imports everything into an empty app', () => {
    const { data, summary } = mergeImport(emptyData(), parsed());
    expect(data.records).toHaveLength(3);
    expect(data.ladder).toHaveLength(2);
    expect(summary.records).toBe(3);
    expect(summary.added).toBe(3 + 2 + 2 + 1 + 1 + 1 + 1);
  });

  test('importing the same file twice changes nothing', () => {
    const once = mergeImport(emptyData(), parsed()).data;
    const twice = mergeImport(once, parsed());
    expect(twice.summary).toEqual({ added: 0, updated: 0, records: 0, steps: 0 });
    expect(twice.data).toEqual(once);
  });

  test('keeps entries written in the app, and the entry updated last wins', () => {
    const app = emptyData();
    app.records.push({ id: 'mine', situation: 'Written in the app', createdAt: '2026-11-14T08:00:00Z' });
    app.records.push({ id: 'r1', situation: 'Edited in the app', updatedAt: '2026-11-14T08:00:00Z' });
    const { data, summary } = mergeImport(app, parsed());
    expect(data.records.find((r) => r.id === 'mine')).toBeTruthy();
    expect(data.records.find((r) => r.id === 'r1')!.situation).toBe('Edited in the app');
    expect(summary.updated).toBe(0);
  });

  test('joins ladder tries and keeps a step done', () => {
    const app = emptyData();
    app.ladder.push({ id: 's1', text: 'Sit in the driver seat, engine off', rating: 10, done: false,
      tries: [{ at: '2026-11-13T10:00:00.000Z', peak: 0 }] });
    const { data, summary } = mergeImport(app, parsed());
    const s1 = data.ladder.find((s) => s.id === 's1')!;
    expect(s1.tries!.map((t) => t.at)).toEqual(['2026-11-02T10:00:00.000Z', '2026-11-13T10:00:00.000Z']);
    expect(s1.done).toBe(true);
    expect(summary.updated).toBe(1);
  });
});

describe('pasted text from the tracker', () => {
  const text = JSON.stringify(trackerExport, null, 2);

  test('reads the export with a BOM, words or a code fence around it', () => {
    for (const t of ['﻿' + text, 'Here is my data:\n' + text + '\nthanks', '```json\n' + text + '\n```', '   ' + text + '\n\n']) {
      const r = parseTrackerExport(t);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.counts).toMatchObject({ records: 2, journal: 1, steps: 2, ladders: 2 });
    }
  });

  test('reads it when the keyboard turned spaces into non-breaking spaces', () => {
    const r = parseTrackerExport(text.replace(/\n {2}/g, '\n  '));
    expect(r.ok).toBe(true);
  });

  test('says clearly when the paste is empty or cut short', () => {
    expect(parseTrackerExport('')).toMatchObject({ ok: false, error: expect.stringMatching(/Paste the text/) });
    expect(parseTrackerExport(text.slice(0, text.length / 2))).toMatchObject({ ok: false, error: expect.stringMatching(/not a whole/) });
  });

  test('a pasted export maps to the same data as the file', () => {
    const fromFile = parseTrackerExport(JSON.stringify(trackerExport));
    const fromPaste = parseTrackerExport('Copied:\n' + text);
    expect(fromPaste).toEqual(fromFile);
    if (!fromPaste.ok) return;
    const { data, summary } = mergeImport(emptyData(), fromPaste.data);
    expect(data.ladders.map((l) => l.name)).toEqual(expect.arrayContaining(['Social', 'Driving']));
    expect(data.records.find((r) => r.id === 'j1')?.text).toBe('A calm evening drive with Dad.');
    expect(summary.added).toBeGreaterThan(0);
  });
});
