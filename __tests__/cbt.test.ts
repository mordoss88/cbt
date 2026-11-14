/* Tests ported from the tracker's cbt-core.test.mjs, so the app keeps the same behavior.
   TZ is pinned to Europe/Belgrade in the test script. */
import assert from 'node:assert/strict';
import * as Core from '../src/core/cbt';

const C: any = Core;
const plain = (v: unknown) => JSON.parse(JSON.stringify(v));
const NOW = Date.parse('2026-10-23T12:00:00Z');
const daysAgo = (d: number) => new Date(NOW - d * 864e5).toISOString();

test('nextStep picks the easiest open step, oldest first on ties', () => {
  const ladder = [
    { id: 'a', rating: 60, done: false, createdAt: '2026-01-01' },
    { id: 'b', rating: 30, done: true, createdAt: '2026-01-01' },
    { id: 'c', rating: 40, done: false, createdAt: '2026-02-01' },
    { id: 'd', rating: 40, done: false, createdAt: '2026-01-15' },
  ];
  assert.equal(C.nextStep(ladder).id, 'd');
  assert.equal(C.nextStep([{ id: 'x', rating: 10, done: true }]), null);
  assert.equal(C.nextStep([]), null);
});

test('sortStepsHardestFirst sorts by rating, then oldest first, without changing the input', () => {
  const ladder = [
    { id: 'a', rating: 20, createdAt: '2026-01-01' },
    { id: 'b', rating: 80, createdAt: '2026-01-02' },
    { id: 'c', rating: 80, createdAt: '2026-01-01' },
  ];
  assert.deepEqual(plain(C.sortStepsHardestFirst(ladder).map((s: any) => s.id)), ['c', 'b', 'a']);
  assert.deepEqual(ladder.map((s: any) => s.id), ['a', 'b', 'c']);
});

test('readyToMarkDone needs the last peak at half the rating or less', () => {
  assert.equal(C.readyToMarkDone({ rating: 60, done: false, tries: [{ peak: 50 }, { peak: 30 }] }), true);
  assert.equal(C.readyToMarkDone({ rating: 60, done: false, tries: [{ peak: 30 }, { peak: 35 }] }), false);
  assert.equal(C.readyToMarkDone({ rating: 60, done: true, tries: [{ peak: 10 }] }), false);
  assert.equal(C.readyToMarkDone({ rating: 60, done: false, tries: [] }), false);
  assert.equal(C.readyToMarkDone({ rating: 60, done: false }), false);
  assert.equal(C.readyToMarkDone({ rating: 60, done: false, tries: [{ peak: null }] }), false);
});

test('stats counts the week, averages and the top patterns', () => {
  const records = [
    { when: daysAgo(1), anxietyBefore: 80, anxietyAfter: 40, traps: ['mind', 'fortune'], safety: ['Left early'], sensations: ['Sweating'] },
    { when: daysAgo(3), anxietyBefore: 60, traps: ['mind'], safety: ['Left early'], safetyOther: ' Held my keys ', sensations: [] },
    { when: daysAgo(10), anxietyBefore: 70, anxietyAfter: 50, traps: ['mind'] },
    { createdAt: daysAgo(2) },
  ];
  const st = C.stats(records, NOW);
  assert.equal(st.count, 4);
  assert.equal(st.week, 3);
  assert.equal(st.avg, 70);
  assert.equal(st.drop, 30);
  assert.equal(st.pairs, 2);
  assert.deepEqual(plain(st.traps[0]), ['mind', 3]);
  assert.deepEqual(plain(st.safety), [['Left early', 2], ['Held my keys', 1]]);
  assert.deepEqual(plain(st.body), [['Sweating', 1]]);
});

test('stats on no records gives empty values, not NaN', () => {
  const st = C.stats([], NOW);
  assert.equal(st.count, 0);
  assert.equal(st.avg, null);
  assert.equal(st.drop, null);
  assert.deepEqual(plain(st.traps), []);
});

test('isWorked is true once Part 2 has content', () => {
  assert.equal(C.isWorked({ situation: 'x' }), false);
  assert.equal(C.isWorked({ balanced: '  ' }), false);
  assert.equal(C.isWorked({ evidenceAgainst: 'facts' }), true);
  assert.equal(C.isWorked({ anxietyAfter: 0 }), true);
});

test('contextLines uses full text until the budget, then short lines', () => {
  const records = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const full = (r: any) => 'F'.repeat(40) + r.id;
  const short = (r: any) => 's' + r.id;
  const lines = C.contextLines(records, 90, full, short);
  assert.deepEqual(plain(lines.map((l: any) => l[0])), ['F', 'F', 's']);
  assert.deepEqual(plain(C.contextLines(records, 0, full, short)), ['s1', 's2', 's3']);
});

test('every country has a name, and Serbia lists 194, 192 and two crisis lines', () => {
  for (const c of C.COUNTRIES) assert.ok(c.name && c.code);
  const rs = C.country('RS');
  assert.deepEqual(plain(rs.emergency.map((n: any) => n[0])), ['194', '192']);
  assert.equal(rs.crisis.length, 2);
  assert.equal(C.country('nope').code, 'OTHER');
});

test('guessCountry maps time zones to countries', () => {
  assert.equal(C.guessCountry('Europe/Belgrade'), 'RS');
  assert.equal(C.guessCountry('Europe/Paris'), 'EU');
  assert.equal(C.guessCountry('America/Chicago'), 'US');
  assert.equal(C.guessCountry('America/Toronto'), 'CA');
  assert.equal(C.guessCountry('Australia/Sydney'), 'AU');
  assert.equal(C.guessCountry('Asia/Tokyo'), 'OTHER');
  assert.equal(C.guessCountry(''), 'OTHER');
});

test('helplineText names the numbers for the coach', () => {
  assert.match(C.helplineText('RS'), /Ambulance 194; Police 192; 0800 309 309/);
  assert.match(C.helplineText('OTHER'), /local emergency number.*findahelpline\.com/);
});

test('exportData keeps every part and stamps the time', () => {
  const out = C.exportData({ records: [{ id: 'r' }], ladder: [{ id: 's' }], notes: [{ id: 'n' }], chat: [] }, NOW);
  assert.equal(out.format, 2);
  assert.deepEqual(plain(out.ladders), [{ id: 'main', name: 'My ladder' }]);
  assert.equal(out.exportedAt, '2026-10-23T12:00:00.000Z');
  assert.deepEqual(plain([out.records.length, out.ladder.length, out.coachNotes.length, out.chat.length]), [1, 1, 1, 0]);
  assert.deepEqual(plain(out.checkins), []);
  assert.deepEqual(plain(out.tests), []);
  assert.deepEqual(plain(C.exportData({}, NOW).records), []);
});

const checkedIn = [{ id: 'c1', at: daysAgo(1), anxiety: 5, interfere: 4, avoid: 3 }];
const tookGad = [{ id: 't1', test: 'gad7', at: daysAgo(3), answers: [1, 1, 1, 1, 1, 1, 1], score: 7 }];

test('dayKey and dayStart use local time', () => {
  // 23:30 UTC on 22 Oct is 01:30 on 23 Oct in Belgrade.
  assert.equal(C.dayKey(Date.parse('2026-10-22T23:30:00Z')), '2026-10-23');
  assert.equal(new Date(C.dayStart(NOW)).toISOString(), '2026-10-22T22:00:00.000Z');
});

test('checkinDue: none yet, or the last one is 7 or more calendar days old', () => {
  assert.equal(C.checkinDue([], NOW), true);
  assert.equal(C.checkinDue(checkedIn, NOW), false);
  assert.equal(C.checkinDue([{ at: daysAgo(6) }], NOW), false);
  assert.equal(C.checkinDue([{ at: daysAgo(7) }, { at: 'bad' }], NOW), true);
  assert.equal(C.lastCheckin([{ at: daysAgo(9), id: 'old' }, { at: daysAgo(2), id: 'new' }]).id, 'new');
});

test('todayTask: the weekly check-in comes first when it is due', () => {
  assert.equal(C.todayTask({}, NOW).kind, 'checkin');
});

test('todayTask: then the newest open Part 2, but not one written in the last 2 hours or over 14 days ago', () => {
  const records = [
    { id: 'fresh', when: new Date(NOW - 36e5).toISOString() },
    { id: 'open', when: daysAgo(2) },
    { id: 'older', when: daysAgo(4) },
    { id: 'stale', when: daysAgo(20) },
    { id: 'worked', when: daysAgo(1), balanced: 'ok' },
  ];
  assert.deepEqual(plain(C.todayTask({ records, checkins: checkedIn, tests: tookGad }, NOW)), { kind: 'part2', id: 'open' });
  assert.notEqual(C.todayTask({ records: [records[0], records[3]], checkins: checkedIn, tests: tookGad }, NOW).kind, 'part2');
});

test('todayTask: then the next ladder step if it was never tried or not tried for 5 days', () => {
  const recent = [{ id: 'r', when: daysAgo(1), balanced: 'ok' }];
  const step = (tries: any) => [{ id: 's', rating: 30, done: false, createdAt: daysAgo(10), tries }];
  assert.deepEqual(plain(C.todayTask({ records: recent, ladder: step([]), checkins: checkedIn, tests: tookGad }, NOW)), { kind: 'ladder', id: 's' });
  assert.equal(C.todayTask({ records: recent, ladder: step([{ at: daysAgo(5), peak: 30 }]), checkins: checkedIn, tests: tookGad }, NOW).kind, 'ladder');
  assert.notEqual(C.todayTask({ records: recent, ladder: step([{ at: daysAgo(2), peak: 30 }]), checkins: checkedIn, tests: tookGad }, NOW).kind, 'ladder');
});

test('todayTask: then a quick entry after 3 quiet days, then building a ladder, then a pattern, then rest', () => {
  const tried = [{ id: 's', rating: 30, tries: [{ at: daysAgo(1), peak: 20 }] }];
  const worked = (d: number, traps?: string[]) => ({ id: 'r' + d + (traps || []).join(''), when: daysAgo(d), balanced: 'ok', traps });
  assert.equal(C.todayTask({ ladder: tried, checkins: checkedIn, tests: tookGad }, NOW).kind, 'log');
  assert.equal(C.todayTask({ records: [worked(3)], ladder: tried, checkins: checkedIn, tests: tookGad }, NOW).kind, 'log');
  assert.equal(C.todayTask({ records: [worked(1), worked(2), worked(2.5)], checkins: checkedIn, tests: tookGad }, NOW).kind, 'build-ladder');
  assert.deepEqual(plain(C.todayTask({ records: [worked(1, ['mind']), worked(2, ['mind', 'label'])], ladder: tried, checkins: checkedIn, tests: tookGad }, NOW)),
    { kind: 'pattern', trap: 'mind' });
  assert.equal(C.todayTask({ records: [worked(1, ['mind'])], ladder: tried, checkins: checkedIn, tests: tookGad }, NOW).kind, 'rest');
});

test('taskDone checks each kind against today', () => {
  const today = new Date(NOW - 36e5).toISOString();
  assert.equal(C.taskDone({ kind: 'checkin' }, { checkins: [] }, NOW), false);
  assert.equal(C.taskDone({ kind: 'checkin' }, { checkins: [{ at: today }] }, NOW), true);
  assert.equal(C.taskDone({ kind: 'part2', id: 'a' }, { records: [{ id: 'a' }] }, NOW), false);
  assert.equal(C.taskDone({ kind: 'part2', id: 'a' }, { records: [{ id: 'a', anxietyAfter: 20 }] }, NOW), true);
  assert.equal(C.taskDone({ kind: 'part2', id: 'gone' }, { records: [] }, NOW), true);
  const ladder = (tries: any, done?: any) => [{ id: 's', rating: 40, done, tries }];
  assert.equal(C.taskDone({ kind: 'ladder', id: 's' }, { ladder: ladder([{ at: daysAgo(2) }]) }, NOW), false);
  assert.equal(C.taskDone({ kind: 'ladder', id: 's' }, { ladder: ladder([{ at: today }]) }, NOW), true);
  assert.equal(C.taskDone({ kind: 'ladder', id: 's' }, { ladder: ladder([], true) }, NOW), true);
  assert.equal(C.taskDone({ kind: 'log' }, { records: [{ when: daysAgo(1) }] }, NOW), false);
  assert.equal(C.taskDone({ kind: 'log' }, { records: [{ when: daysAgo(1), createdAt: today }] }, NOW), true);
  assert.equal(C.taskDone({ kind: 'build-ladder' }, { ladder: [{ id: 's' }] }, NOW), true);
  assert.equal(C.taskDone({ kind: 'pattern', trap: 'mind' }, {}, NOW), false);
  assert.equal(C.taskDone({ kind: 'rest' }, {}, NOW), true);
});

test('weekSummary counts practice days, tries and anxiety against the week before', () => {
  const d = {
    records: [
      { when: daysAgo(0), anxietyBefore: 60 },
      { when: daysAgo(0.1), anxietyBefore: 40 },
      { when: daysAgo(3), anxietyBefore: 50 },
      { when: daysAgo(9), anxietyBefore: 80 },
      { when: daysAgo(20), anxietyBefore: 10 },
    ],
    ladder: [{ id: 's', tries: [{ at: daysAgo(2), peak: 30 }, { at: daysAgo(10), peak: 60 }] }],
    checkins: [{ at: daysAgo(5), anxiety: 6 }, { at: daysAgo(12), anxiety: 7 }, { at: 'bad' }],
  };
  const w = C.weekSummary(d, NOW);
  assert.equal(w.days.length, 7);
  assert.equal(w.days[6].day, '2026-10-23');
  assert.equal(w.days[0].day, '2026-10-17');
  assert.deepEqual(plain(w.days.filter((x: any) => x.on).map((x: any) => x.day)), ['2026-10-18', '2026-10-20', '2026-10-21', '2026-10-23']);
  assert.equal(w.practiceDays, 4);
  assert.equal(w.goal, 4);
  assert.equal(w.tries, 1);
  assert.equal(w.avg, 45);
  assert.equal(w.avgPrev, 70);
  assert.deepEqual(plain(w.checkins.map((c: any) => c.anxiety)), [7, 6]);
});

test('weekSummary on no data gives zeros and nulls', () => {
  const w = C.weekSummary({}, NOW);
  assert.equal(w.practiceDays, 0);
  assert.equal(w.avg, null);
  assert.equal(w.avgPrev, null);
  assert.deepEqual(plain(w.checkins), []);
});

test('parseLadderPlan reads JSON in a code fence, sorts easiest first and rounds ratings', () => {
  const text = 'Here you go:\n```json\n{"intro":"Start slow.","steps":[{"text":"Drive on a field road with Dad","rating":32},{"text":"Sit in the driver seat, engine off","rating":10},{"text":"  ","rating":20},{"text":"No rating"}],"safety":"Only with your licence."}\n```';
  const plan = C.parseLadderPlan(text, []);
  assert.equal(plan.intro, 'Start slow.');
  assert.equal(plan.safety, 'Only with your licence.');
  assert.deepEqual(plain(plan.steps), [{ text: 'Sit in the driver seat, engine off', rating: 10 }, { text: 'Drive on a field road with Dad', rating: 30 }]);
});

test('parseLadderPlan drops steps already on the ladder or repeated, and caps ratings and count', () => {
  const steps = Array.from({ length: 15 }, (_: unknown, i: number) => ({ text: 'Step ' + i, rating: i * 10 }));
  steps.push({ text: 'step 1', rating: 5 }, { text: 'Too hard', rating: 140 });
  const plan = C.parseLadderPlan(JSON.stringify({ steps }), [{ text: 'Step 0' }]);
  assert.equal(plan.steps.length, 12);
  assert.ok(!plan.steps.some((s: any) => s.text === 'Step 0'));
  assert.equal(plan.steps.filter((s: any) => s.text.toLowerCase() === 'step 1').length, 1);
  assert.ok(plan.steps.every((s: any) => s.rating >= 0 && s.rating <= 100));
});

test('parseLadderPlan returns null for text without valid JSON, and keeps an intro with no steps', () => {
  assert.equal(C.parseLadderPlan('Sorry, I cannot help with that.'), null);
  assert.equal(C.parseLadderPlan('{not json}'), null);
  assert.deepEqual(plain(C.parseLadderPlan('{"intro":"Are you safe right now?","steps":[]}')), { intro: 'Are you safe right now?', steps: [], safety: '' });
});

test('todayTask: the GAD-7 self-check comes after the check-in, every 14 days', () => {
  assert.deepEqual(plain(C.todayTask({ checkins: checkedIn }, NOW)), { kind: 'test', id: 'gad7' });
  assert.equal(C.todayTask({ checkins: checkedIn, tests: [{ test: 'gad7', at: daysAgo(13) }] }, NOW).kind, 'log');
  assert.equal(C.todayTask({ checkins: checkedIn, tests: [{ test: 'gad7', at: daysAgo(14) }] }, NOW).kind, 'test');
  assert.equal(C.taskDone({ kind: 'test', id: 'gad7' }, { tests: [{ test: 'gad7', at: new Date(NOW - 6e5).toISOString() }] }, NOW), true);
  assert.equal(C.taskDone({ kind: 'test', id: 'gad7' }, { tests: [] }, NOW), false);
});

test('scoreTest GAD-7 sums the answers and uses the published ranges', () => {
  assert.deepEqual(plain(C.scoreTest('gad7', [0, 0, 0, 0, 0, 0, 0])), { score: 0, max: 21, band: 'minimal' });
  assert.equal(C.scoreTest('gad7', [1, 1, 1, 1, 1, 0, 0]).band, 'mild');
  assert.equal(C.scoreTest('gad7', [2, 2, 2, 2, 1, 0, 0]).score, 9);
  assert.equal(C.scoreTest('gad7', [2, 2, 2, 2, 2, 0, 0]).band, 'moderate');
  assert.equal(C.scoreTest('gad7', [3, 3, 3, 3, 3, 0, 0]).band, 'severe');
  assert.equal(C.scoreTest('gad7', [3, 3, 3, 3, 3, 3, 3]).score, 21);
});

test('scoreTest returns null for missing or invalid answers', () => {
  assert.equal(C.scoreTest('gad7', [1, 1, 1]), null);
  assert.equal(C.scoreTest('gad7', [1, 1, 1, 1, 1, 1, null]), null);
  assert.equal(C.scoreTest('gad7', [1, 1, 1, 1, 1, 1, 4]), null);
  assert.equal(C.scoreTest('ipip', Array(20).fill(0)), null);
  assert.equal(C.scoreTest('nope', []), null);
});

test('scoreTest Mini-IPIP reverses the minus-keyed items, 4 to 20 per trait', () => {
  assert.equal(C.testDef('ipip').items.length, 20);
  assert.deepEqual(plain(C.scoreTest('ipip', Array(20).fill(3)).traits), { E: 12, A: 12, C: 12, N: 12, I: 12 });
  // "Very accurate" on every plus item and "Very inaccurate" on every minus item gives the top score.
  const top = C.testDef('ipip').items.map((it: any) => (it[2] > 0 ? 5 : 1));
  assert.deepEqual(plain(C.scoreTest('ipip', top).traits), { E: 20, A: 20, C: 20, N: 20, I: 20 });
  const all5 = C.scoreTest('ipip', Array(20).fill(5)).traits;
  assert.equal(all5.E, 12);
  assert.equal(all5.I, 8);
  assert.deepEqual(plain(['low', 'middle', 'high']), plain([C.traitLevel(9), C.traitLevel(10), C.traitLevel(15)]));
});

test('testHistory sorts one test oldest first, and testDue follows each test\'s interval', () => {
  const results = [{ test: 'gad7', at: daysAgo(2), score: 5 }, { test: 'ipip', at: daysAgo(30) }, { test: 'gad7', at: daysAgo(20), score: 9 }, { test: 'gad7', at: 'bad' }];
  assert.deepEqual(plain(C.testHistory(results, 'gad7').map((r: any) => r.score)), [9, 5]);
  assert.equal(C.testDue(results, 'gad7', NOW), false);
  assert.equal(C.testDue(results, 'ipip', NOW), false);
  assert.equal(C.testDue([], 'ipip', NOW), true);
  assert.equal(C.testDue(results, 'nope', NOW), false);
});

test('ladders: steps without a known ladder belong to the first one, and each ladder has its own next step', () => {
  assert.deepEqual(plain(C.ladderList([])), [{ id: 'main', name: 'My ladder' }]);
  const ladders = [{ id: 'a', name: 'Social' }, { id: 'b', name: 'Driving' }, { id: 'a', name: 'Dup' }];
  assert.equal(C.ladderList(ladders).length, 2);
  const steps = [
    { id: 's1', rating: 50 }, { id: 's2', ladder: 'b', rating: 20 }, { id: 's3', ladder: 'gone', rating: 10 }, { id: 's4', ladder: 'b', rating: 10, done: true },
  ];
  assert.equal(C.stepLadder(steps[2], ladders), 'a');
  assert.deepEqual(plain(C.stepsOf(steps, ladders, 'a').map((s: any) => s.id)), ['s1', 's3']);
  assert.deepEqual(plain(C.nextSteps(steps, ladders).map((s: any) => s.id)), ['s3', 's2']);
});

test('journal entries never need Part 2', () => {
  assert.equal(C.isJournal({ kind: 'journal', text: 'hi' }), true);
  assert.equal(C.isJournal({ situation: 'x' }), false);
  assert.equal(C.isJournal(null), false);
  assert.equal(C.needsPart2({ kind: 'journal', text: 'hi' }), false);
  assert.equal(C.needsPart2({ situation: 'x' }), true);
  assert.equal(C.needsPart2({ situation: 'x', balanced: 'ok' }), false);
});

test('todayTask skips journal entries for Part 2, but they still count as writing', () => {
  const tried = [{ id: 's', rating: 30, tries: [{ at: daysAgo(1), peak: 20 }] }];
  const j = { id: 'j', kind: 'journal', text: 'A long day.', when: daysAgo(1) };
  const t = C.todayTask({ records: [j], ladder: tried, checkins: checkedIn, tests: tookGad }, NOW);
  assert.notEqual(t.kind, 'part2');
  assert.notEqual(t.kind, 'log');
  const open = { id: 'open', when: daysAgo(2) };
  assert.deepEqual(plain(C.todayTask({ records: [j, open], checkins: checkedIn, tests: tookGad }, NOW)), { kind: 'part2', id: 'open' });
  assert.equal(C.taskDone({ kind: 'part2', id: 'j' }, { records: [j] }, NOW), true);
});

test('stats and weekSummary count journal entries, and use the anxiety only when it is set', () => {
  const recs = [
    { id: 'a', kind: 'journal', text: 'x', when: daysAgo(1), anxietyBefore: 40 },
    { id: 'b', kind: 'journal', text: 'y', when: daysAgo(2), anxietyBefore: null },
  ];
  const s = C.stats(recs, NOW);
  assert.equal(s.count, 2);
  assert.equal(s.avg, 40);
  const w = C.weekSummary({ records: recs }, NOW);
  assert.equal(w.practiceDays, 2);
  assert.equal(w.avg, 40);
});

test('ratingChange compares a new rating with the first one', () => {
  assert.equal(C.ratingChange(null, 30), null);
  assert.equal(C.ratingChange(undefined, undefined), null);
  assert.deepEqual(plain(C.ratingChange(70, null)), { before: 70, after: null, diff: null, dir: null, text: 'Before: 70' });
  const down = C.ratingChange(70, 35);
  assert.equal(down.diff, -35);
  assert.equal(down.dir, 'down');
  assert.equal(down.text, 'Down 35 from 70');
  assert.equal(C.ratingChange(40, 50).text, 'Up 10 from 40');
  assert.equal(C.ratingChange(40, 50).dir, 'up');
  assert.equal(C.ratingChange(60, 60).dir, 'same');
  assert.equal(C.ratingChange(0, 0).text, 'The same as before (0)');
});

