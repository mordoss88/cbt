import { buildInfoRows } from '../src/core/buildInfo';

describe('build info in About', () => {
  test('an EAS update shows the commit, its first line, and when the update was published', () => {
    const rows = buildInfoRows({
      commitSha: '5b1c1bd0123456789', commitMessage: 'Resizable widget\n\nlong body', commitTime: '2026-11-26T14:40:00+01:00',
      updateId: 'abcdef12-3456-7890', updateCreatedAt: new Date(2026, 10, 26, 14, 45), isEmbedded: false, channel: 'preview', runtimeVersion: 'f00dbabe1234567890',
    });
    expect(rows).toEqual([
      ['Commit', '5b1c1bd · Resizable widget'],
      ['Commit time', '2026-11-26 14:40'],
      ['Update', 'abcdef12'],
      ['Published', '2026-11-26 14:45'],
      ['Channel', 'preview'],
      ['Runtime', 'f00dbabe1234'],
    ]);
  });

  test('the installed build without an update says so', () => {
    const rows = buildInfoRows({ isEmbedded: true, updateId: 'x', channel: 'preview' });
    expect(rows[0][1]).toMatch(/not known/);
    expect(rows.find((r) => r[0] === 'Update')?.[1]).toMatch(/none yet/);
    expect(rows.some((r) => r[0] === 'Published')).toBe(false);
  });

  test('a bad date is left out', () => {
    expect(buildInfoRows({ commitSha: 'abc', commitTime: 'nope' }).some((r) => r[0] === 'Commit time')).toBe(false);
  });
});
