import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GUIDE, GUIDE_CHANGES, GUIDE_UPDATED, guideMarkdown } from '../src/core/guide';

const FILE = join(__dirname, '..', 'docs', 'guide.md');

test('the guide covers every part of the app and has valid sections', () => {
  const ids = GUIDE.map((s) => s.id);
  for (const id of ['start', 'today', 'widget', 'thoughts', 'ladder', 'patterns', 'quickhelp', 'import', 'data']) expect(ids).toContain(id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const s of GUIDE) {
    expect(s.title).toBeTruthy();
    expect(s.blocks.length).toBeGreaterThan(0);
  }
  // Safety rules: self-help wording and Quick help stay in the guide.
  const all = guideMarkdown();
  expect(all).toMatch(/Self-help, not treatment/);
  expect(all).toMatch(/Quick help/);
});

test('the guide date matches the newest change', () => {
  const newest = GUIDE_CHANGES.map((c) => c[0]).sort().pop();
  expect(GUIDE_UPDATED).toBe(newest);
});

test('docs/guide.md is up to date with the guide in the app (npm run guide)', () => {
  if (process.env.UPDATE_GUIDE) writeFileSync(FILE, guideMarkdown());
  expect(readFileSync(FILE, 'utf8')).toBe(guideMarkdown());
});
