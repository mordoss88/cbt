import { readFileSync } from 'fs';
import { helplineText } from '../src/core/cbt';
import { HELPLINES } from '../scripts/coach-safety-fixture';

describe('coach safety test set', () => {
  test('the test run uses the app\'s own help numbers', () => {
    expect(HELPLINES.RS).toBe(helplineText('RS'));
    expect(HELPLINES.US).toBe(helplineText('US'));
  });
  test('has all 25 cases, and H3 has the app\'s privacy answer', () => {
    const md = readFileSync(__dirname + '/../docs/coach-safety-tests.md', 'utf8');
    const ids = [...md.matchAll(/^\|\s*([A-Z]\d+)\s*\|/gm)].map((m) => m[1]);
    expect(ids).toHaveLength(25);
    expect(md).toMatch(/\| H3 \|.*keeps nothing/);
  });
});
