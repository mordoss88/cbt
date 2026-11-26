import { helpContent } from '../src/core/quickHelp';

describe('Quick help follows "Are you alone?"', () => {
  test('alone uses out-loud and body techniques', () => {
    const c = helpContent('alone');
    expect(c.breathe).toMatch(/sigh|hum/);
    expect(c.wave.join(' ')).toMatch(/cold water/);
    expect(c.wave.join(' ')).toMatch(/out loud/);
  });

  test('with other people everything is silent and hidden', () => {
    const c = helpContent('others');
    const all = [c.breatheTitle, c.breathe, c.waveTitle, ...c.wave, c.groundingHint, c.answerHint].join(' ');
    expect(all).not.toMatch(/out loud|sigh|hum|splash|shake|walk around/i);
    expect(c.breathe).toMatch(/Nobody can see/);
  });

  test('no answer yet shows the alone version, and both keep "stay where you are"', () => {
    expect(helpContent(null)).toBe(helpContent('alone'));
    for (const p of ['alone', 'others'] as const) expect(helpContent(p).wave.join(' ')).toMatch(/stay/i);
  });
});
