/* The home-screen widget and the app share ratings through the widget's own props.
   A tap on "Helps" or "Not for me" in the widget runs in the widget runtime (no app needed): it sets `rating`
   and appends "<quoteId>:<rating>:<ms>" to `pending`. When the app opens it reads the props back,
   saves each pending rating, and pushes fresh props with an empty `pending`. */
import { dayKey } from './cbt';
import { pinQuote, quoteById, rateQuote, type Quote, type QuoteRating, type QuoteState } from './quotes';

/* One day on the widget: [day, quote id, text, rating]. */
export type WidgetDay = [string, string, string, '' | QuoteRating];

export interface QuoteWidgetProps {
  quoteId: string;
  text: string;
  day: string;
  rating: '' | QuoteRating;
  pending: string;
  url: string;
  /* JSON of WidgetDay[] for today and the next days. The Android widget picks today's entry itself
     each time it draws (about once an hour), so the saying changes at midnight without the app. */
  days?: string;
}

export const WIDGET_DAYS = 14;

export const WIDGET_NAME = 'QuoteWidget';
export const WIDGET_URL = 'cbtlog://today';

export function widgetProps(quote: Quote, day: string, state: QuoteState, days?: WidgetDay[]): QuoteWidgetProps {
  const p: QuoteWidgetProps = { quoteId: quote.id, text: quote.text, day, rating: state.ratings[quote.id]?.rating ?? '', pending: '', url: WIDGET_URL };
  if (days) p.days = JSON.stringify(days);
  return p;
}

/* The next days in order, starting with `days[0]`. Each day is picked as if the days before it were shown,
   so the 14-day no-repeat rule holds. Only the state passed in is used: nothing is pinned for real. */
export function widgetSchedule(state: QuoteState, dayKeys: string[]): WidgetDay[] {
  let s = state;
  return dayKeys.map((day) => {
    const r = pinQuote(s, day);
    s = r.state;
    return [day, r.quote.id, r.quote.text, state.ratings[r.quote.id]?.rating ?? ''] as WidgetDay;
  });
}

/* The entry to show on `today`: that day, else the last day before it, else the first. Same rule as in the widget. */
export function widgetDayFor(days: WidgetDay[], today: string): WidgetDay | null {
  if (!days.length) return null;
  let best: WidgetDay | null = null;
  for (const d of days) if (d[0] <= today) best = d;
  return best ?? days[0];
}

export function parsePending(pending: unknown): { id: string; rating: QuoteRating; at: string }[] {
  if (typeof pending !== 'string' || !pending) return [];
  return pending.split(';').map((part) => {
    const [id, rating, ms] = part.split(':');
    const t = Number(ms);
    if (!quoteById(id) || (rating !== 'up' && rating !== 'down') || !isFinite(t) || t <= 0) return null;
    return { id, rating: rating as QuoteRating, at: new Date(t).toISOString() };
  }).filter((x): x is { id: string; rating: QuoteRating; at: string } => !!x);
}

/* Apply every pending widget rating, oldest first, so the newest tap wins. */
export function mergeWidgetRatings(state: QuoteState, propsList: (Partial<QuoteWidgetProps> | null | undefined)[]): { state: QuoteState; added: number } {
  const all = propsList.flatMap((p) => parsePending(p?.pending)).sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  let next = state;
  let added = 0;
  for (const r of all) {
    const before = next;
    next = rateQuote(next, r.id, r.rating, r.at, 'widget');
    if (next !== before) added++;
  }
  return { state: next, added };
}

/* The day keys for today and the next days, in local time. */
export function nextDayKeys(now: number, n = WIDGET_DAYS) {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + i);
    out.push(dayKey(d.getTime()));
  }
  return out;
}
