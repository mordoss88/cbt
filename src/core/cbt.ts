/* Core logic, ported from the tracker's CBTCore (cbt-log.html, <script id="cbt-core">).
   Pure functions with no React Native imports, so Jest tests them directly. */
import type { AppData, Checkin, Ladder, LadderStep, LadderTry, TestResult, ThoughtRecord } from './types';

export interface Country {
  code: string;
  name: string;
  emergency: [string, string][];
  crisis: [string, string][];
}

export const COUNTRIES: Country[] = [
  { code: 'RS', name: 'Serbia', emergency: [['194', 'Ambulance'], ['192', 'Police']],
    crisis: [['0800 309 309', 'Suicide prevention line, then press 1. Every day, 24 hours.'], ['0800 300 303', 'Centar Srce. Every day, 14:00 to 23:00.']] },
  { code: 'DE', name: 'Germany', emergency: [['112', 'Ambulance'], ['110', 'Police']], crisis: [['0800 111 0 111', 'TelefonSeelsorge. Every day, 24 hours.']] },
  { code: 'GB', name: 'United Kingdom', emergency: [['999', 'Emergency'], ['111', 'NHS urgent help']], crisis: [['116 123', 'Samaritans. Every day, 24 hours.']] },
  { code: 'IE', name: 'Ireland', emergency: [['112', 'Emergency'], ['999', 'Emergency']], crisis: [['116 123', 'Samaritans. Every day, 24 hours.']] },
  { code: 'US', name: 'United States', emergency: [['911', 'Emergency']], crisis: [['988', 'Suicide and Crisis Lifeline. Call or text, 24 hours.']] },
  { code: 'CA', name: 'Canada', emergency: [['911', 'Emergency']], crisis: [['988', 'Suicide Crisis Helpline. Call or text, 24 hours.']] },
  { code: 'AU', name: 'Australia', emergency: [['000', 'Emergency']], crisis: [['13 11 14', 'Lifeline. Every day, 24 hours.']] },
  { code: 'EU', name: 'Another country in Europe', emergency: [['112', 'Emergency']], crisis: [] },
  { code: 'OTHER', name: 'Another country', emergency: [], crisis: [] },
];
const ZONES: Record<string, string> = {
  'Europe/Belgrade': 'RS', 'Europe/Berlin': 'DE', 'Europe/London': 'GB', 'Europe/Dublin': 'IE',
  'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Edmonton': 'CA', 'America/Winnipeg': 'CA',
  'America/Halifax': 'CA', 'America/St_Johns': 'CA', 'America/Regina': 'CA',
};
const US_ZONES = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Phoenix', 'America/Anchorage', 'America/Detroit', 'Pacific/Honolulu'];

export const TRAPS = [
  { k: 'mind', name: 'Mind reading', d: 'You think you know what others think of you.' },
  { k: 'fortune', name: 'Fortune telling', d: 'You predict that it will go badly.' },
  { k: 'catastrophe', name: 'Catastrophizing', d: 'You expect the worst possible result.' },
  { k: 'spotlight', name: 'Spotlight effect', d: 'You think everyone can see your anxiety.' },
  { k: 'allnothing', name: 'All-or-nothing', d: 'It must be perfect, or it is a failure.' },
  { k: 'discount', name: 'Discounting the positive', d: 'Good results "do not count".' },
  { k: 'should', name: '"Should" rules', d: 'You must never look nervous or make a mistake.' },
  { k: 'label', name: 'Labeling', d: '"I am stupid." "I am weird."' },
];
export const trapName = (k: string) => TRAPS.find((t) => t.k === k)?.name ?? k;
export const BODY = ['Heart racing', 'Sweating', 'Blushing', 'Shaky voice', 'Tight chest', 'Short breath', 'Dizzy', 'Stomach', 'Tense muscles', 'Mind went blank'];
export const SAFETY = ['Avoided it', 'Left early', 'Rehearsed what to say', 'Avoided eye contact', 'Kept camera off', 'Stayed quiet', 'Used my phone', 'Asked for reassurance', 'Drank or smoked to calm down', 'Hid my hands or face'];
export const STEP_IDEAS: [string, number][] = [
  ['Ask a shop worker where something is', 20],
  ['Make a phone call to book something', 30],
  ['Sit in a busy café for 15 minutes', 30],
  ['Start small talk with a neighbor', 35],
  ['Walk up the stairs fast to feel your heart beat faster', 35],
  ['Keep the camera on for a full work call', 40],
  ['Take a bus or tram at a busy time', 45],
  ['Eat alone in a café', 50],
  ['Wait one day before you search a body symptom online', 50],
  ['Say one thing in a meeting without rehearsing', 55],
  ['Go to a big supermarket alone at a busy time', 55],
  ['Ask a question in a team meeting', 60],
  ['Give a status update without notes', 70],
  ['Disagree politely with someone', 75],
  ['Tell one person you trust about your anxiety', 85],
];

export function num(v: unknown): v is number {
  return typeof v === 'number' && !isNaN(v);
}
export function timeOf(r: { when?: string | null; createdAt?: string }): number {
  let t = Date.parse(r.when ?? '');
  if (isNaN(t)) t = Date.parse(r.createdAt ?? '');
  return isNaN(t) ? 0 : t;
}
function mean(a: number[]) {
  return a.reduce((x, y) => x + y, 0) / a.length;
}
export function countTop(arr: (string | undefined | null)[]): [string, number][] {
  const m: Record<string, number> = {};
  arr.forEach((x) => { if (x) m[x] = (m[x] || 0) + 1; });
  return Object.keys(m).map((k): [string, number] => [k, m[k]]).sort((a, b) => b[1] - a[1]);
}
export function isWorked(r: ThoughtRecord) {
  return !!((r.balanced || '').trim() || (r.evidenceAgainst || '').trim() || num(r.anxietyAfter));
}
/* Journal entries are free text. They have no Part 2, so they never wait for one. */
export function isJournal(r: ThoughtRecord | null | undefined) {
  return !!r && r.kind === 'journal';
}
export function needsPart2(r: ThoughtRecord) {
  return !isJournal(r) && !isWorked(r);
}

/* Ladder: hardest first for display; the next step is the easiest open one. */
export function sortStepsHardestFirst(ladder: LadderStep[]) {
  return ladder.slice().sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return String(a.createdAt).localeCompare(String(b.createdAt));
  });
}
export function nextStep(ladder: LadderStep[]): LadderStep | null {
  const open = ladder.filter((s) => !s.done);
  if (!open.length) return null;
  open.sort((a, b) => a.rating - b.rating || String(a.createdAt).localeCompare(String(b.createdAt)));
  return open[0];
}
/* Several ladders. All steps stay in one list, and each step has a "ladder" id.
   Steps without a known ladder id (older data) belong to the first ladder. */
export const DEFAULT_LADDER: Ladder = { id: 'main', name: 'My ladder' };
export function ladderList(ladders: Ladder[] | null | undefined): Ladder[] {
  const seen: Record<string, boolean> = {};
  const list = (Array.isArray(ladders) ? ladders : []).filter((l) => {
    if (!l || !l.id || seen[l.id]) return false;
    seen[l.id] = true;
    return true;
  });
  return list.length ? list : [{ id: DEFAULT_LADDER.id, name: DEFAULT_LADDER.name }];
}
export function stepLadder(step: LadderStep, ladders: Ladder[] | null | undefined) {
  const list = ladderList(ladders);
  return list.some((l) => l.id === step.ladder) ? (step.ladder as string) : list[0].id;
}
export function stepsOf(steps: LadderStep[] | null | undefined, ladders: Ladder[] | null | undefined, id: string) {
  return (steps || []).filter((s) => stepLadder(s, ladders) === id);
}
/* The next step of each ladder, in ladder order. */
export function nextSteps(steps: LadderStep[], ladders: Ladder[] | null | undefined) {
  return ladderList(ladders).map((l) => nextStep(stepsOf(steps, ladders, l.id))).filter((s): s is LadderStep => !!s);
}
/* A step is ready when the last try peaked at half its rating or less. */
export function readyToMarkDone(step: LadderStep) {
  const tries = step.tries || [];
  const last = tries[tries.length - 1];
  return !step.done && !!last && num(last.peak) && last.peak <= step.rating / 2;
}

export function stats(records: ThoughtRecord[], now: number) {
  const week = records.filter((r) => { const t = timeOf(r); return t && now - t <= 7 * 864e5; }).length;
  const withA = records.filter((r) => num(r.anxietyBefore));
  const pairs = records.filter((r) => num(r.anxietyBefore) && num(r.anxietyAfter));
  return {
    count: records.length,
    week,
    pairs: pairs.length,
    avg: withA.length ? Math.round(mean(withA.map((r) => r.anxietyBefore as number))) : null,
    drop: pairs.length ? Math.round(mean(pairs.map((r) => (r.anxietyBefore as number) - (r.anxietyAfter as number)))) : null,
    traps: countTop(records.flatMap((r) => r.traps || [])),
    safety: countTop(records.flatMap((r) => (r.safety || []).concat(r.safetyOther ? [r.safetyOther.trim()] : []))),
    body: countTop(records.flatMap((r) => r.sensations || [])),
  };
}

/* Coach context (for the coach, later): full text for the newest records until the budget is used, then one line each. */
export function contextLines<T>(records: T[], budget: number, fullLine: (r: T) => string, shortLine: (r: T) => string) {
  const lines: string[] = [];
  let used = 0;
  records.forEach((r) => {
    let f = fullLine(r);
    if (used + f.length > budget) f = shortLine(r);
    used += f.length;
    lines.push(f);
  });
  return lines;
}

/* Days in local time. */
export const DAY = 864e5;
const pad = (n: number) => (n < 10 ? '0' : '') + n;
export function dayKey(t: number | Date) {
  const d = new Date(t);
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}
export function dayStart(t: number | Date) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
export function daysBetween(a: number, b: number) {
  return Math.round((dayStart(b) - dayStart(a)) / DAY);
}

/* Weekly check-in: three 0-10 ratings. Due when the last one is 7 or more calendar days old. */
export function lastCheckin(checkins: Checkin[] | null | undefined): Checkin | null {
  const list = (checkins || []).filter((c) => !isNaN(Date.parse(c.at)));
  list.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  return list[0] || null;
}
export function checkinDue(checkins: Checkin[] | null | undefined, now: number) {
  const c = lastCheckin(checkins);
  return !c || daysBetween(Date.parse(c.at), now) >= 7;
}

/* Self-checks. GAD-7 (public domain, phqscreeners.com) and Mini-IPIP (IPIP items, public domain).
   Scores are for self-monitoring, not a diagnosis. */
export type TestItem = [string] | [string, string, number];
export interface TestDef {
  id: string;
  name: string;
  short: string;
  everyDays: number;
  intro: string;
  options: [string, number][];
  items: TestItem[];
  extra?: { q: string; options: string[] };
}
const GAD_OPTS: [string, number][] = [['Not at all', 0], ['Several days', 1], ['More than half the days', 2], ['Nearly every day', 3]];
const IPIP_OPTS: [string, number][] = [['Very inaccurate', 1], ['Moderately inaccurate', 2], ['Neither', 3], ['Moderately accurate', 4], ['Very accurate', 5]];
export const TESTS: TestDef[] = [
  { id: 'gad7', name: 'Anxiety self-check (GAD-7)', short: 'Anxiety', everyDays: 14,
    intro: 'Over the last 2 weeks, how often have you been bothered by the following problems?',
    options: GAD_OPTS,
    items: [['Feeling nervous, anxious, or on edge'], ['Not being able to stop or control worrying'], ['Worrying too much about different things'],
      ['Trouble relaxing'], ['Being so restless that it is hard to sit still'], ['Becoming easily annoyed or irritable'], ['Feeling afraid, as if something awful might happen']],
    extra: { q: 'If you had any of these problems, how difficult have they made it to do your work, take care of things at home, or get along with other people?',
      options: ['Not difficult at all', 'Somewhat difficult', 'Very difficult', 'Extremely difficult'] } },
  { id: 'ipip', name: 'Personality (Mini-IPIP)', short: 'Personality', everyDays: 180,
    intro: 'How well does each sentence describe you as you generally are now, not as you wish to be?',
    options: IPIP_OPTS,
    items: [['Am the life of the party.', 'E', 1], ['Sympathize with others\' feelings.', 'A', 1], ['Get chores done right away.', 'C', 1], ['Have frequent mood swings.', 'N', 1],
      ['Have a vivid imagination.', 'I', 1], ['Don\'t talk a lot.', 'E', -1], ['Am not interested in other people\'s problems.', 'A', -1],
      ['Often forget to put things back in their proper place.', 'C', -1], ['Am relaxed most of the time.', 'N', -1], ['Am not interested in abstract ideas.', 'I', -1],
      ['Talk to a lot of different people at parties.', 'E', 1], ['Feel others\' emotions.', 'A', 1], ['Like order.', 'C', 1], ['Get upset easily.', 'N', 1],
      ['Have difficulty understanding abstract ideas.', 'I', -1], ['Keep in the background.', 'E', -1], ['Am not really interested in others.', 'A', -1],
      ['Make a mess of things.', 'C', -1], ['Seldom feel blue.', 'N', -1], ['Do not have a good imagination.', 'I', -1]] },
];
export const TRAITS: [string, string][] = [['E', 'Extraversion'], ['A', 'Agreeableness'], ['C', 'Conscientiousness'], ['N', 'Emotional reactivity'], ['I', 'Imagination']];
export function testDef(id: string) {
  return TESTS.find((t) => t.id === id) ?? null;
}
export function gadBand(score: number) {
  return score <= 4 ? 'minimal' : score <= 9 ? 'mild' : score <= 14 ? 'moderate' : 'severe';
}
export function traitLevel(v: number) {
  return v <= 9 ? 'low' : v <= 14 ? 'middle' : 'high';
}
/* answers: one option value per item. Returns null until every item is answered with a valid value. */
export function scoreTest(id: string, answers: unknown):
  | { score: number; max: number; band: string }
  | { traits: Record<string, number> }
  | null {
  const t = testDef(id);
  if (!t || !Array.isArray(answers) || answers.length !== t.items.length) return null;
  const valid = t.options.map((o) => o[1]);
  if (answers.some((a) => valid.indexOf(a) < 0)) return null;
  if (id === 'gad7') {
    const sum = (answers as number[]).reduce((a, b) => a + b, 0);
    return { score: sum, max: 21, band: gadBand(sum) };
  }
  const traits: Record<string, number> = {};
  TRAITS.forEach((x) => { traits[x[0]] = 0; });
  t.items.forEach((it, k) => {
    const a = answers[k] as number;
    traits[it[1] as string] += (it[2] as number) > 0 ? a : 6 - a;
  });
  return { traits };
}
export function testHistory(results: TestResult[] | null | undefined, id: string) {
  return (results || []).filter((r) => r.test === id && !isNaN(Date.parse(r.at)))
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}
export function testDue(results: TestResult[] | null | undefined, id: string, now: number) {
  const t = testDef(id);
  const h = testHistory(results, id);
  const last = h[h.length - 1];
  return !!t && (!last || daysBetween(Date.parse(last.at), now) >= t.everyDays);
}

/* Today's task: one small step, picked by fixed rules in this order. */
export type TodayTask =
  | { kind: 'checkin' }
  | { kind: 'test'; id: string }
  | { kind: 'part2'; id: string }
  | { kind: 'ladder'; id: string }
  | { kind: 'log' }
  | { kind: 'build-ladder' }
  | { kind: 'pattern'; trap: string }
  | { kind: 'rest' };
const TASK = { part2MinAge: 2 * 36e5, part2MaxDays: 14, ladderGapDays: 5, quietDays: 3 };
function lastTry(step: LadderStep): LadderTry | null {
  const t = step.tries || [];
  return t[t.length - 1] || null;
}
type TaskData = Partial<Pick<AppData, 'records' | 'ladder' | 'ladders' | 'checkins' | 'tests'>>;
export function todayTask(d: TaskData, now: number): TodayTask {
  const records = d.records || [];
  const ladder = d.ladder || [];
  if (checkinDue(d.checkins, now)) return { kind: 'checkin' };
  if (testDue(d.tests, 'gad7', now)) return { kind: 'test', id: 'gad7' };
  const open = records.filter((r) => {
    const t = timeOf(r);
    return t && needsPart2(r) && now - t >= TASK.part2MinAge && daysBetween(t, now) <= TASK.part2MaxDays;
  }).sort((a, b) => timeOf(b) - timeOf(a));
  if (open.length) return { kind: 'part2', id: open[0].id };
  /* One next step per ladder. Pick the one that waited longest (never tried first), then the easiest. */
  const due = nextSteps(ladder, d.ladders).map((s) => {
    const lt = lastTry(s);
    const t = lt ? Date.parse(lt.at) : 0;
    return { s, t: isNaN(t) ? 0 : t };
  }).filter((x) => !x.t || daysBetween(x.t, now) >= TASK.ladderGapDays);
  due.sort((a, b) => a.t - b.t || a.s.rating - b.s.rating);
  if (due.length) return { kind: 'ladder', id: due[0].s.id };
  const newest = records.reduce((m, r) => Math.max(m, timeOf(r)), 0);
  if (!newest || daysBetween(newest, now) >= TASK.quietDays) return { kind: 'log' };
  if (!ladder.length && records.length >= 3) return { kind: 'build-ladder' };
  const traps = stats(records, now).traps;
  if (traps.length && traps[0][1] >= 2) return { kind: 'pattern', trap: traps[0][0] };
  return { kind: 'rest' };
}
/* Is today's task done? "pattern" is done only when the person says so. */
export function taskDone(task: TodayTask | null | undefined, d: TaskData, now: number): boolean {
  const from = dayStart(now);
  const records = d.records || [];
  const ladder = d.ladder || [];
  switch (task?.kind) {
    case 'checkin': return !checkinDue(d.checkins, now);
    case 'test': return !testDue(d.tests, task.id, now);
    case 'part2': { const r = records.find((x) => x.id === task.id); return !r || !needsPart2(r); }
    case 'ladder': {
      const s = ladder.find((x) => x.id === task.id);
      if (!s || s.done) return true;
      return (s.tries || []).some((x) => Date.parse(x.at) >= from);
    }
    case 'log': return records.some((r) => timeOf(r) >= from || Date.parse(r.createdAt ?? '') >= from);
    case 'build-ladder': return ladder.length > 0;
    case 'rest': return true;
    default: return false;
  }
}

/* The last 7 days, today included: practice days, ladder tries and average anxiety against the 7 days before. */
export function weekSummary(d: TaskData, now: number) {
  const records = d.records || [];
  const ladder = d.ladder || [];
  const checkins = d.checkins || [];
  const today = new Date(dayStart(now));
  const days: string[] = [];
  const on: Record<string, boolean> = {};
  for (let i = 6; i >= 0; i--) days.push(dayKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)));
  const start = dayStart(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6));
  const prevStart = dayStart(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 13));
  const tries = ladder.flatMap((s) => s.tries || []);
  const cur: number[] = [];
  const prev: number[] = [];
  let nTries = 0;
  const add = (t: number, v: unknown, isTry?: boolean) => {
    if (!t) return;
    if (t >= start) { on[dayKey(t)] = true; if (num(v)) cur.push(v); if (isTry) nTries++; }
    else if (t >= prevStart && num(v)) prev.push(v);
  };
  records.forEach((r) => add(timeOf(r), r.anxietyBefore));
  tries.forEach((x) => { const t = Date.parse(x.at); add(isNaN(t) ? 0 : t, x.peak, true); });
  checkins.forEach((c) => { const t = Date.parse(c.at); if (!isNaN(t) && t >= start) on[dayKey(t)] = true; });
  const list = days.map((k) => ({ day: k, on: !!on[k] }));
  return {
    days: list,
    practiceDays: list.filter((x) => x.on).length,
    goal: 4,
    tries: nTries,
    avg: cur.length ? Math.round(mean(cur)) : null,
    avgPrev: prev.length ? Math.round(mean(prev)) : null,
    checkins: checkins.filter((c) => !isNaN(Date.parse(c.at))).sort((a, b) => Date.parse(a.at) - Date.parse(b.at)).slice(-6),
  };
}

/* Ladder helper: read a coach plan (JSON, maybe inside a code fence). Steps come back easiest first,
   ratings rounded to 5, without empty steps or steps already on the ladder. */
export function parseLadderPlan(text: unknown, ladder: LadderStep[] | null | undefined) {
  const src = String(text == null ? '' : text);
  const a = src.indexOf('{');
  const b = src.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  let o: any;
  try { o = JSON.parse(src.slice(a, b + 1)); } catch { return null; }
  if (!o || typeof o !== 'object') return null;
  const have: Record<string, boolean> = {};
  (ladder || []).forEach((s) => { have[String(s.text).trim().toLowerCase()] = true; });
  const steps: { text: string; rating: number }[] = [];
  (Array.isArray(o.steps) ? o.steps : []).forEach((x: any) => {
    const t = String((x && x.text) || '').replace(/\s+/g, ' ').trim().slice(0, 160);
    const k = t.toLowerCase();
    const r = Number(x && x.rating);
    if (!t || have[k] || isNaN(r)) return;
    have[k] = true;
    steps.push({ text: t, rating: Math.max(0, Math.min(100, Math.round(r / 5) * 5)) });
  });
  steps.sort((x, y) => x.rating - y.rating);
  return { intro: String(o.intro || '').trim(), steps: steps.slice(0, 12), safety: String(o.safety || '').trim() };
}

/* Re-rating: compare a new 0-100 rating with the first one, for example anxiety after Part 2 with anxiety in the moment. */
export function ratingChange(before: unknown, after: unknown) {
  if (!num(before)) return null;
  if (!num(after)) return { before, after: null, diff: null, dir: null, text: 'Before: ' + before };
  const d = after - before;
  return {
    before, after, diff: d,
    dir: d < 0 ? 'down' : d > 0 ? 'up' : 'same',
    text: d < 0 ? 'Down ' + -d + ' from ' + before : d > 0 ? 'Up ' + d + ' from ' + before : 'The same as before (' + before + ')',
  };
}

export function country(code: string | null | undefined): Country {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[COUNTRIES.length - 1];
}
export function guessCountry(timeZone: string | null | undefined) {
  if (!timeZone) return 'OTHER';
  if (ZONES[timeZone]) return ZONES[timeZone];
  if (US_ZONES.indexOf(timeZone) >= 0) return 'US';
  if (timeZone.indexOf('Australia/') === 0) return 'AU';
  if (timeZone.indexOf('Europe/') === 0) return 'EU';
  return 'OTHER';
}
export function helplineText(code: string) {
  const c = country(code);
  const L: string[] = [];
  c.emergency.forEach((n) => L.push(n[1] + ' ' + n[0]));
  c.crisis.forEach((n) => L.push(n[0] + ' (' + n[1].replace(/\.$/, '') + ')'));
  return c.name + ': ' + (L.length ? L.join('; ') : 'local emergency number') + '. Other countries: findahelpline.com';
}

/* Export: the same format 2 as the tracker, plus the quote ratings. */
export function exportData(d: Partial<AppData> & { quoteRatings?: unknown[] }, now: number) {
  return {
    app: 'CBT Practice Log', format: 2, exportedAt: new Date(now).toISOString(),
    records: d.records || [], ladders: ladderList(d.ladders), ladder: d.ladder || [], checkins: d.checkins || [],
    tests: d.tests || [], coachNotes: d.notes || [], chat: d.chat || [], quoteRatings: d.quoteRatings || [],
  };
}

export function anxietyLevel(v: unknown): 'calm' | 'mid' | 'high' | 'none' {
  if (!num(v)) return 'none';
  return v < 35 ? 'calm' : v < 65 ? 'mid' : 'high';
}
