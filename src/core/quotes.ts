/* Daily CBT sayings. One a day, the same on the widget and in the app.
   The person rates a saying "Helps" or "Not for me". Helpful sayings come back more often,
   "Not for me" sayings do not come back. All sayings are written for this app (no attributed quotes).
   Since 2026-11-16 they focus on procrastination (p..) and social anxiety (s..). A saying that was
   rewritten got a new id, so an old rating never sticks to new words. */

export interface Quote {
  id: string;
  text: string;
  /* The CBT idea behind it, shown in the app under the saying. */
  why: string;
}

export const QUOTES: Quote[] = [
  { id: 'q01', text: "Shift your mindset from 'I can't' to 'I can'. Small steps still count.", why: 'Changing the words you use changes what you try. Trying is how anxiety shrinks.' },
  { id: 'p01', text: 'You do not need to feel ready. Start for five minutes, then decide.', why: 'Motivation often comes after you start, not before.' },
  { id: 's01', text: 'People notice your nerves far less than you think.', why: 'Your feelings are much harder to see from the outside than they feel inside.' },
  { id: 'p02', text: 'Waiting to feel like it is a trap. Do it first, the mood follows.', why: 'Doing comes first. The wish to do often comes after.' },
  { id: 's02', text: 'Say the thing. A pause or a shaky voice is not a disaster.', why: 'Speaking without being perfect shows you that it is OK.' },
  { id: 'p03', text: 'Make the first step so small it feels silly. Just open the file.', why: 'A tiny step gets you past the hardest part: starting.' },
  { id: 's03', text: 'Focus on them, not on you. Ask one question and really listen.', why: 'Watching yourself raises social anxiety. Paying attention to others lowers it.' },
  { id: 'q04', text: 'You do not have to feel calm to do the brave thing.', why: 'Action comes first. Calm often follows.' },
  { id: 'p04', text: 'Putting it off brings relief now and more stress later.', why: 'The quick relief rewards avoiding, so the habit grows.' },
  { id: 's04', text: 'You do not need to rehearse every word. Let the talk be a bit messy.', why: 'Rehearsing is a safety behavior. It keeps the fear going.' },
  { id: 'p05', text: 'Done is better than perfect. A rough first try can be fixed.', why: 'Perfectionism keeps tasks from starting.' },
  { id: 's05', text: 'A quiet moment in a talk is normal. Others feel it too, and it passes.', why: 'Silence feels much longer to you than to anyone else.' },
  { id: 'p06', text: '\'Later\' is not a time. Pick a time and write it down.', why: 'A clear plan (when and where) makes starting more likely.' },
  { id: 's06', text: 'Mind reading is guessing. You do not know what they think of you.', why: 'Mind reading is a thinking trap. Look for the evidence.' },
  { id: 'q07', text: 'Avoiding it today makes it bigger tomorrow.', why: 'Avoidance teaches your brain that the situation is dangerous.' },
  { id: 'p07', text: 'Ask: what feeling am I avoiding? Name it, then start anyway.', why: 'Putting things off is often avoiding a feeling, not the task.' },
  { id: 's07', text: 'After the event, skip the replay. Note one thing that went fine.', why: 'Replaying the event looks only at mistakes and makes the fear grow.' },
  { id: 'p08', text: 'Tomorrow\'s you will not feel more ready. Start a little today.', why: 'We expect our future self to have more energy than we will.' },
  { id: 's08', text: 'You do not have to be perfect to be liked. People like real.', why: 'Small mistakes often make people seem warmer, not worse.' },
  { id: 'p09', text: 'Break it down until the next step takes less than ten minutes.', why: 'Small, clear steps make a big task less scary.' },
  { id: 's09', text: 'Speak up once today: a question, a hello, or what you think.', why: 'Small social steps build confidence, like steps on a ladder.' },
  { id: 'q10', text: 'Most people are too busy with their own day to judge yours.', why: 'The spotlight effect makes us think everyone notices.' },
  { id: 'p10', text: 'The task is rarely as bad as the dread before it.', why: 'The fear before a task is usually bigger than the task. Compare them.' },
  { id: 's10', text: 'Blushing is your body reacting, not a verdict on you.', why: 'Body signs are normal, and others judge them less than you fear.' },
  { id: 'p11', text: 'Set a timer for 15 minutes. You can stop when it rings.', why: 'A short time limit makes starting feel safe.' },
  { id: 's11', text: 'If someone looks bored, they may just be tired.', why: 'Finding other explanations weakens the self-critical one.' },
  { id: 'p12', text: 'Busy is not the same as done. Do the one task you keep moving.', why: 'Easy tasks can hide the hard one you avoid.' },
  { id: 's12', text: 'Make the call now. Thinking about it longer only grows the fear.', why: 'Waiting feeds the fear before the event.' },
  { id: 'q24', text: 'Today, do one thing anxiety tells you not to do. A small one.', why: 'Each small win teaches your brain a new rule.' },
  { id: 'p13', text: 'One email sent beats ten emails planned.', why: 'Planning can become a way to avoid doing.' },
  { id: 's13', text: 'Saying \'I am a bit nervous\' out loud often makes it smaller.', why: 'Hiding anxiety takes effort. Naming it can lower the pressure.' },
  { id: 'p14', text: 'You did not fail because you waited. Start again from right now.', why: 'Blaming yourself makes the next delay more likely. Kindness helps you restart.' },
  { id: 's14', text: 'Keep the phone in your pocket while you wait. Let yourself be seen.', why: 'Hiding behind the phone is a safety behavior in social places.' },
  { id: 'p15', text: 'Put the phone in another room for the first ten minutes.', why: 'Removing easy escapes makes avoiding harder.' },
  { id: 's15', text: 'An awkward moment is one moment, not who you are.', why: 'Labeling turns one moment into who you are.' },
  { id: 'q27', text: 'Safety behaviors keep the fear alive. Try once without them.', why: 'Without safety behaviors you learn that you can cope.' },
  { id: 'p16', text: '\'I work better under pressure\' is a story. Test it once.', why: 'An experiment checks a belief that keeps the habit going.' },
  { id: 's16', text: 'You belong in the room, even when it feels like you do not.', why: 'Not belonging is a feeling, not a fact.' },
  { id: 'p17', text: 'Reward the start, not only the finish.', why: 'Rewarding small steps builds the habit of starting.' },
  { id: 's17', text: 'Reply to the message now. Waiting makes it harder to send.', why: 'Avoiding grows with time. A quick, short reply keeps it small.' },
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
