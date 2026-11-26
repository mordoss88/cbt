/* Quick help adapts to where the person is. Alone: out loud and with the body (sigh, hum, cold water, move).
   With other people: silent and hidden (breathe through the nose, press the feet, hold something).
   The medical signs and the emergency and crisis numbers are the same in both and always show. */

export type HelpPlace = 'alone' | 'others';

export interface HelpContent {
  breatheTitle: string;
  breathe: string;
  waveTitle: string;
  wave: string[];
  groundingHint: string;
  answerHint: string;
}

const ALONE: HelpContent = {
  breatheTitle: '1 · Breathe out slowly, out loud',
  breathe: 'Breathe in for 4. Breathe out for 6 with a long sigh or a hum. A long breath out tells your body to calm down.',
  waveTitle: '2 · Let the wave pass',
  wave: [
    'Do not fight the feelings. Notice them and let them stay. They pass faster this way.',
    'Use your body: splash cold water on your face, or hold something cold.',
    'Shake out your hands and arms, or walk around the room. Then drop your shoulders.',
    'Say it out loud: "This is anxiety. It will pass."',
    'If you can, stay where you are. When you leave, your brain learns that the place is dangerous.',
  ],
  groundingHint: 'Look around. Say each thing out loud and tap one dot for it.',
  answerHint: 'Read the answer out loud.',
};

const OTHERS: HelpContent = {
  breatheTitle: '1 · Breathe out slowly, quietly',
  breathe: 'Breathe in through your nose for 4. Breathe out for 6, slowly, with closed lips. Nobody can see it. A long breath out tells your body to calm down.',
  waveTitle: '2 · Let the wave pass, without anyone noticing',
  wave: [
    'Do not fight the feelings. Notice them and let them stay. They pass faster this way.',
    'Press your feet into the floor. Hold your cup, your phone or the edge of the table, and feel it.',
    'Drop your shoulders. Unclench your jaw. Talk a bit slower.',
    'Most people cannot see what you feel inside. You do not have to hide or explain it.',
    'If you can, stay. If you need a moment, step out for a few minutes, then come back.',
  ],
  groundingHint: 'Look around without moving your head much. Name each thing in your mind and tap one dot.',
  answerHint: 'Read the answer silently, twice.',
};

export function helpContent(place: HelpPlace | null | undefined): HelpContent {
  return place === 'others' ? OTHERS : ALONE;
}
