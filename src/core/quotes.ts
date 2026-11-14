/* Daily CBT sayings. One a day, the same on the widget and in the app.
   The person rates a saying "Helps" or "Not for me". Helpful sayings come back more often,
   "Not for me" sayings do not come back. All sayings are written for this app (no attributed quotes). */

export interface Quote {
  id: string;
  text: string;
  /* The CBT idea behind it, shown in the app under the saying. */
  why: string;
}

export const QUOTES: Quote[] = [
  { id: 'q01', text: "Shift your mindset from 'I can't' to 'I can'. Small steps still count.", why: 'Changing the words you use changes what you try. Trying is how anxiety shrinks.' },
  { id: 'q02', text: 'A thought is not a fact. It is a guess your brain made in a hurry.', why: 'Thought records test the guess against the facts.' },
  { id: 'q03', text: 'Anxiety goes up, and then it comes down. It always comes down.', why: 'Anxiety peaks and fades by itself when you stay with it.' },
  { id: 'q04', text: 'You do not have to feel calm to do the brave thing.', why: 'Action comes first. Calm often follows.' },
  { id: 'q05', text: 'Feelings are visitors. Let them come and let them go.', why: 'Fighting a feeling feeds it. Noticing it lets it pass.' },
  { id: 'q06', text: 'Ask: what is the evidence? Then ask: what else could be true?', why: 'Looking for other explanations weakens a scary thought.' },
  { id: 'q07', text: 'Avoiding it today makes it bigger tomorrow.', why: 'Avoidance teaches your brain that the situation is dangerous.' },
  { id: 'q08', text: 'Progress, not perfection.', why: 'All-or-nothing thinking hides real progress.' },
  { id: 'q09', text: 'Breathe out longer than you breathe in. Your body listens.', why: 'A long breath out slows the heart and calms the alarm.' },
  { id: 'q10', text: 'Most people are too busy with their own day to judge yours.', why: 'The spotlight effect makes us think everyone notices.' },
  { id: 'q11', text: 'What would you tell a friend who felt this way? Tell yourself that.', why: 'We are often kinder and wiser with friends than with ourselves.' },
  { id: 'q12', text: 'Uncomfortable is not the same as dangerous.', why: 'Anxiety feels awful, but it is your body\'s alarm, not harm.' },
  { id: 'q13', text: 'You have survived every hard day so far.', why: 'Your track record is evidence against the worst-case story.' },
  { id: 'q14', text: 'One step up the ladder is still a step.', why: 'Exposure works in small, repeated steps.' },
  { id: 'q15', text: 'Worry is not a plan. Pick one small action, or let it go for now.', why: 'Problem solving turns worry into something you can do.' },
  { id: 'q16', text: '"What if" is a question, not a prediction.', why: 'Fortune telling feels certain, but it is only one possible story.' },
  { id: 'q17', text: 'You can feel anxious and still do what matters to you.', why: 'You do not need to wait for anxiety to leave before you live.' },
  { id: 'q18', text: 'Name it to tame it: "This is anxiety. It will pass."', why: 'Labeling a feeling makes it less intense.' },
  { id: 'q19', text: 'The goal is not zero anxiety. The goal is a full life with some anxiety in it.', why: 'Trying to remove all anxiety keeps you stuck.' },
  { id: 'q20', text: 'Mistakes are proof that you are trying.', why: '"Should" rules make normal mistakes feel like disasters.' },
  { id: 'q21', text: 'Your heart racing is your body getting ready, not breaking down.', why: 'Body signs of panic are a normal stress response.' },
  { id: 'q22', text: 'Be curious about the fear instead of obeying it.', why: 'Curiosity turns a threat into an experiment.' },
  { id: 'q23', text: 'The thought "I will fail" is a forecast, and forecasts are often wrong.', why: 'Compare your predictions with what really happened.' },
  { id: 'q24', text: 'Today, do one thing anxiety tells you not to do. A small one.', why: 'Each small win teaches your brain a new rule.' },
  { id: 'q25', text: 'Good moments count too. Write one down.', why: 'Anxiety discounts the positive. Noticing it balances the picture.' },
  { id: 'q26', text: 'You are not your thoughts. You are the one who notices them.', why: 'Stepping back from thoughts gives you room to choose.' },
  { id: 'q27', text: 'Safety behaviors keep the fear alive. Try once without them.', why: 'Without safety behaviors you learn that you can cope.' },
  { id: 'q28', text: 'Slow down. Feet on the floor. Look around and name five things.', why: 'Grounding brings your attention back to now.' },
  { id: 'q29', text: 'Rest is part of the work, not a break from it.', why: 'A tired brain sees more danger. Rest lowers the alarm.' },
  { id: 'q30', text: 'Every time you stay, your brain learns: "I can handle this."', why: 'Staying until anxiety drops is how exposure works.' },
  { id: 'q31', text: 'Labels like "I am weird" are not facts. Describe what happened instead.', why: 'Labeling turns one moment into who you are.' },
  { id: 'q32', text: 'Discomfort is the feeling of growing.', why: 'New skills feel strange before they feel natural.' },
  { id: 'q33', text: 'You do not have to believe every thought you think.', why: 'Thoughts are mental events, not orders.' },
  { id: 'q34', text: 'Worst case, best case, most likely case. Which one is most likely?', why: 'Catastrophizing skips the most likely outcome.' },
  { id: 'q35', text: 'Courage is anxiety that took one more step.', why: 'Brave people feel fear too. They act anyway.' },
  { id: 'q36', text: 'Small and steady beats big and rare.', why: 'Short, regular practice builds habits that last.' },
  { id: 'q37', text: 'Be as patient with yourself as you are with others.', why: 'Self-criticism raises anxiety. Kindness lowers it.' },
  { id: 'q38', text: 'This feeling is temporary. You have felt it pass before.', why: 'Remembering past waves makes this one less scary.' },
  { id: 'q39', text: 'Check the facts, then choose your next step.', why: 'Facts first, then action. Not the other way around.' },
  { id: 'q40', text: 'You can do hard things, one small step at a time.', why: 'Breaking a fear into steps makes it possible.' },
];

export type QuoteRating = 'up' | 'down';
export interface QuoteRatingEntry {
  id: string;
  rating: QuoteRating;
  at: string;
  /* Where it was rated: in the app or on the home-screen widget. */
  from?: 'app' | 'widget';
}
export interface QuoteState {
  /* One pinned quote per day: the widget and the app show the same one. */
  shown: { day: string; id: string }[];
  ratings: Record<string, QuoteRatingEntry>;
}
export const emptyQuoteState = (): QuoteState => ({ shown: [], ratings: {} });

export function quoteById(id: string | null | undefined): Quote | null {
  return QUOTES.find((q) => q.id === id) ?? null;
}

/* A small stable hash (FNV-1a), so the same day gives the same pick on every device and in tests. */
export function hash(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

const WEIGHT = { up: 3, none: 2, down: 0 };
const NO_REPEAT_DAYS = 14;

/* Pick the quote for a day. Rules:
   - A day that already has a pinned quote keeps it.
   - "Not for me" quotes are left out (unless every quote is rated "Not for me").
   - Quotes shown in the last 14 pinned days are left out while others remain.
   - "Helps" quotes weigh 3, unrated quotes weigh 2. The day's hash picks by weight. */
export function pickQuote(day: string, state: QuoteState, quotes: Quote[] = QUOTES): Quote {
  const pinned = state.shown.find((s) => s.day === day);
  if (pinned) {
    const q = quotes.find((x) => x.id === pinned.id);
    if (q) return q;
  }
  const rating = (id: string) => state.ratings[id]?.rating;
  let pool = quotes.filter((q) => rating(q.id) !== 'down');
  if (!pool.length) pool = quotes.slice();
  const recent = new Set(
    state.shown.filter((s) => s.day < day).sort((a, b) => (a.day < b.day ? 1 : -1)).slice(0, NO_REPEAT_DAYS).map((s) => s.id),
  );
  const fresh = pool.filter((q) => !recent.has(q.id));
  if (fresh.length) pool = fresh;
  const weights = pool.map((q) => (rating(q.id) === 'up' ? WEIGHT.up : WEIGHT.none));
  const total = weights.reduce((a, b) => a + b, 0);
  let n = hash(day) % total;
  for (let i = 0; i < pool.length; i++) {
    if (n < weights[i]) return pool[i];
    n -= weights[i];
  }
  return pool[pool.length - 1];
}

/* Pin the day's quote. Keeps the last 60 days. */
export function pinQuote(state: QuoteState, day: string, quotes: Quote[] = QUOTES): { state: QuoteState; quote: Quote } {
  const quote = pickQuote(day, state, quotes);
  if (state.shown.some((s) => s.day === day && s.id === quote.id)) return { state, quote };
  const shown = state.shown.filter((s) => s.day !== day).concat([{ day, id: quote.id }])
    .sort((a, b) => (a.day < b.day ? -1 : 1)).slice(-60);
  return { state: { ...state, shown }, quote };
}

/* Save a rating. A newer rating replaces an older one; an older one (for example a late widget sync) is ignored.
   rating null clears it. */
export function rateQuote(state: QuoteState, id: string, rating: QuoteRating | null, at: string, from: 'app' | 'widget' = 'app'): QuoteState {
  if (!quoteById(id) && !state.ratings[id]) return state;
  const prev = state.ratings[id];
  if (prev && Date.parse(prev.at) > Date.parse(at)) return state;
  const ratings = { ...state.ratings };
  if (rating) ratings[id] = { id, rating, at, from };
  else delete ratings[id];
  return { ...state, ratings };
}

export function ratedList(state: QuoteState, rating: QuoteRating) {
  return Object.values(state.ratings)
    .filter((r) => r.rating === rating && quoteById(r.id))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .map((r) => ({ ...r, quote: quoteById(r.id) as Quote }));
}
