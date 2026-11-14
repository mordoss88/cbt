/* The home-screen widget and the app share ratings through the widget's own props.
   A tap on "Helps" or "Not for me" in the widget runs in the widget runtime (no app needed): it sets `rating`
   and appends "<quoteId>:<rating>:<ms>" to `pending`. When the app opens it reads the props back,
   saves each pending rating, and pushes fresh props with an empty `pending`. */
import { quoteById, rateQuote, type Quote, type QuoteRating, type QuoteState } from './quotes';

export interface QuoteWidgetProps {
  quoteId: string;
  text: string;
  day: string;
  rating: '' | QuoteRating;
  pending: string;
  url: string;
}

export const WIDGET_NAME = 'QuoteWidget';
export const WIDGET_URL = 'cbtlog://today';

export function widgetProps(quote: Quote, day: string, state: QuoteState): QuoteWidgetProps {
  return { quoteId: quote.id, text: quote.text, day, rating: state.ratings[quote.id]?.rating ?? '', pending: '', url: WIDGET_URL };
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
