import {
  COACH_MESSAGES, coachDataContext, entryFull, focusIds, historyTurns, parseCoachStream, problemFromStatus, recordLine,
  runCoachTool, stepLines, textOf, toolUses, wholeText,
} from '../src/core/coach';
import { emptyData, type AppData, type ChatMessage, type ThoughtRecord } from '../src/core/types';
import { COACH_TOOLS, checkRequest, coachParams, coachRules, systemBlocks } from '../supabase/functions/coach/rules';
import { helplineText } from '../src/core/cbt';

const NOW = new Date(2026, 10, 26, 15, 0).getTime();
const rec = (o: Partial<ThoughtRecord>): ThoughtRecord => ({ id: 'r1', when: '2026-11-20T09:30:00', situation: 'Team meeting', anxietyBefore: 70, thought: 'They will see I am nervous', ...o });

describe('coach context', () => {
  test('a record line has the date, anxiety, situation and thought; full lines add every field', () => {
    const r = rec({ traps: ['mind'], evidenceAgainst: 'Nobody said anything', anxietyAfter: 40, balanced: 'Some nerves are normal', beliefAfter: 30 });
    expect(recordLine(r, false)).toBe('- Fri 20 Nov 2026, 09:30 · anxiety 70 → 40 after Part 2 · Team meeting · thought: "They will see I am nervous"');
    const full = recordLine(r, true);
    expect(full).toContain('Against the thought: Nobody said anything');
    expect(full).toContain('Balanced thought: Some nerves are normal (belief 30/100)');
    expect(full).not.toContain('Part 2 not done');
  });

  test('an entry the person asked about is sent whole, line breaks kept', () => {
    const long = 'line one\nline two\n\n\n\nline three ' + 'x'.repeat(3000);
    const t = entryFull(rec({ situation: long }));
    expect(t).toContain('Situation:\nline one\nline two\n\nline three');
    expect(t).toContain('x'.repeat(3000));
    expect(t).toContain('(Part 2 not done yet)');
    expect(wholeText('a'.repeat(30), 10)).toBe('a'.repeat(10) + '\n[... 20 more characters not shown]');
  });

  test('focusIds gives the newest asked-about entries first, no repeats', () => {
    const chat: ChatMessage[] = [
      { role: 'user', text: 'a', recId: 'r1', createdAt: '2026-11-20T10:00:00Z' },
      { role: 'user', text: 'b', recId: 'r2', createdAt: '2026-11-21T10:00:00Z' },
      { role: 'assistant', text: 'c', createdAt: '2026-11-21T10:01:00Z' },
      { role: 'user', text: 'd', recId: 'r1', createdAt: '2026-11-22T10:00:00Z' },
    ];
    expect(focusIds(chat)).toEqual(['r1', 'r2']);
  });

  test('the data context has every section and the asked-about entry, and no rules', () => {
    const d: AppData = {
      ...emptyData(),
      records: [rec({})],
      notes: [{ id: 'n1', text: 'Sister is my safe person' }],
      ladder: [{ id: 's1', text: 'Say one thing in the meeting', rating: 50, tries: [{ at: '2026-11-21T10:00:00', peak: 40 }] }],
      chat: [{ role: 'user', text: 'Talk', recId: 'r1', createdAt: '2026-11-22T10:00:00Z' }],
    };
    const c = coachDataContext(d, NOW, { today: 'Weekly check-in (not done yet)' });
    for (const h of ['YOUR NOTES', 'SUMMARY', 'SELF-CHECKS', 'FEAR LADDERS', 'ENTRIES THE PERSON ASKED ABOUT', 'THOUGHT RECORDS', 'END OF DATA'])
      expect(c).toContain(h);
    expect(c).toContain('- Sister is my safe person');
    expect(c).toContain('Today: Weekly check-in (not done yet).');
    expect(c).toContain('[NEXT] Say one thing in the meeting (rated 50) · 1 try: Sat 21 Nov 2026, 10:00 peak 40');
    expect(c).not.toContain('SAFETY');
  });

  test('ladder lines say when there are no steps', () => {
    expect(stepLines([])).toBe('- (no steps yet)');
  });
});

describe('chat history for the request', () => {
  const m = (role: 'user' | 'assistant', text: string, min: number): ChatMessage => ({ role, text, createdAt: new Date(NOW + min * 6e4).toISOString() });
  test('oldest first, ends with the person, starts with the person', () => {
    const chat = [m('assistant', 'Hi', 0), m('user', 'one', 1), m('assistant', 'two', 2), m('user', 'three', 3)];
    expect(historyTurns(chat)).toEqual([{ role: 'user', content: 'one' }, { role: 'assistant', content: 'two' }, { role: 'user', content: 'three' }]);
  });
  test('nothing to send when the last message is the coach\'s', () => {
    expect(historyTurns([m('user', 'a', 0), m('assistant', 'b', 1)])).toEqual([]);
  });
  test('keeps at most N turns and a character budget, but always the last message', () => {
    const chat = Array.from({ length: 50 }, (_, i) => m(i % 2 ? 'assistant' : 'user', 'msg' + i, i)).concat([m('user', 'last', 60)]);
    const t = historyTurns(chat, 10);
    expect(t.length).toBeLessThanOrEqual(10);
    expect(t[t.length - 1].content).toBe('last');
    expect(t[0].role).toBe('user');
    expect(historyTurns([m('user', 'x'.repeat(100), 0), m('user', 'y'.repeat(100), 1)], 30, 50)).toEqual([{ role: 'user', content: 'y'.repeat(100) }]);
  });
});

describe('coach tools run on the phone', () => {
  const ctx = { now: '2026-11-26T14:00:00Z', newId: (() => { let i = 0; return () => 'id' + ++i; })() };
  test('remember saves one short note', () => {
    const r = runCoachTool('remember', { note: '  My sister is my   safe person ' }, emptyData(), ctx);
    expect(r.result).toBe('saved');
    expect(r.data.notes.map((n) => n.text)).toEqual(['My sister is my safe person']);
    expect(r.action).toEqual({ type: 'memory', text: 'My sister is my safe person' });
    expect(runCoachTool('remember', { note: '' }, emptyData(), ctx).isError).toBe(true);
  });
  test('add_ladder_step adds to the open ladder, rounds the rating, and skips repeats', () => {
    const r = runCoachTool('add_ladder_step', { text: 'Go to the gym at peak hour', rating: 63 }, emptyData(), ctx);
    expect(r.data.ladder).toHaveLength(1);
    expect(r.data.ladder[0]).toMatchObject({ text: 'Go to the gym at peak hour', rating: 65, ladder: 'main' });
    expect(r.result).toBe('Added to the "My ladder" ladder: Go to the gym at peak hour (rated 65)');
    const again = runCoachTool('add_ladder_step', { text: 'go to the gym at peak hour', rating: 60 }, r.data, ctx);
    expect(again.data.ladder).toHaveLength(1);
    expect(again.result).toMatch(/already/);
  });
  test('a new ladder name starts a new ladder', () => {
    const r = runCoachTool('add_ladder_step', { text: 'Drive around the block', rating: 30, ladder: 'Driving' }, emptyData(), ctx);
    expect(r.data.ladders.map((l) => l.name)).toEqual(['My ladder', 'Driving']);
    expect(r.result).toMatch(/a new ladder/);
    expect(r.action?.text).toBe('Drive around the block (30) · Driving');
  });
  test('an unknown tool is an error and changes nothing', () => {
    const d = emptyData();
    const r = runCoachTool('delete_everything', {}, d, ctx);
    expect(r.isError).toBe(true);
    expect(r.data).toBe(d);
  });
});

describe('the proxy answer', () => {
  test('parses whole lines and keeps the rest for later', () => {
    const a = parseCoachStream('{"type":"text","text":"Hel"}\n{"type":"text","text":"lo"}\n{"type":"do');
    expect(a.events).toEqual([{ type: 'text', text: 'Hel' }, { type: 'text', text: 'lo' }]);
    const b = parseCoachStream(a.rest + 'ne","stop_reason":"end_turn","content":[{"type":"text","text":"Hello"}]}\nnot json\n');
    expect(b.events).toEqual([{ type: 'done', stop_reason: 'end_turn', content: [{ type: 'text', text: 'Hello' }] }]);
    expect(b.rest).toBe('');
  });
  test('finds tool calls and text in the final content', () => {
    const content = [{ type: 'thinking', thinking: '', signature: 's' }, { type: 'text', text: 'Saving.' }, { type: 'tool_use', id: 't1', name: 'remember', input: { note: 'x' } }];
    expect(toolUses(content)).toEqual([content[2]]);
    expect(textOf(content)).toBe('Saving.');
  });
  test('status codes map to messages the person can act on', () => {
    expect(problemFromStatus(401)).toBe('signed-out');
    expect(problemFromStatus(503)).toBe('not-enabled');
    expect(problemFromStatus(500, 'refused')).toBe('refused');
    expect(COACH_MESSAGES.refused).toMatch(/Quick help/);
  });
});

describe('coach rules on the server', () => {
  const rules = coachRules(helplineText('RS'));
  test('keep the tracker\'s safety rules and the app\'s Quick help and privacy answer', () => {
    expect(rules).toContain('194');
    expect(rules).toContain('0800 309 309');
    expect(rules).toMatch(/suicide, self-harm or being in danger/);
    expect(rules).toMatch(/chest pain that is new/);
    expect(rules).toMatch(/Quick help button/);
    expect(rules).toMatch(/not a person or a therapist/);
    expect(rules).toMatch(/keeps nothing/);
    expect(rules).toMatch(/Never give information about doses/);
    expect(rules).toMatch(/prescribed/);
  });
  test('tools are described only when they are on', () => {
    expect(rules).toContain('TOOLS');
    expect(coachRules('x', false)).not.toContain('TOOLS');
    expect(COACH_TOOLS.map((t) => t.name)).toEqual(['remember', 'add_ladder_step']);
  });
  test('the request: rules, cached data, then the time; fallbacks on; no forced tool', () => {
    const p = coachParams({ context: 'DATA', helplines: 'H', now: 'Thu 26 Nov', messages: [{ role: 'user', content: 'hi' }] });
    expect(p.model).toBe('claude-opus-5-5');
    expect(p.fallbacks).toBe('default');
    expect(p.betas).toContain('server-side-fallback-2026-07-01');
    expect(p.system.map((b) => b.text)).toEqual([coachRules('H'), 'DATA', 'Now: Thu 26 Nov']);
    expect(systemBlocks('DATA', 'H', 'x')[1].cache_control).toEqual({ type: 'ephemeral' });
    expect(p.tool_choice).toEqual({ type: 'auto' });
    expect('thinking' in p).toBe(false);
  });
  test('checks what the app sends', () => {
    const ok = { context: 'c', helplines: 'h', now: 'n', messages: [{ role: 'user', content: 'hi' }] };
    expect(checkRequest(ok)).toBeNull();
    expect(checkRequest({ ...ok, messages: [] })).toBe('bad-request');
    expect(checkRequest({ ...ok, messages: [{ role: 'assistant', content: 'x' }] })).toBe('bad-request');
    expect(checkRequest({ ...ok, messages: [{ role: 'system', content: 'x' }] })).toBe('bad-request');
    expect(checkRequest({ ...ok, context: 'x'.repeat(400_001) })).toBe('too-large');
    expect(checkRequest(null)).toBe('bad-request');
  });
});
