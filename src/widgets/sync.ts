/* Keeps the home-screen widget and the app in step.
   - pull: read ratings made on the widget (iOS: the widget timeline; Android: stored props through the local module).
   - push: show today's saying (iOS also gets the next 7 days, so the widget changes daily without the app).
   Only the saying goes to the widget. No entries or other personal data. */
import { Platform } from 'react-native';
import { addUserInteractionListener } from 'expo-widgets';
import { getWidgetPropsJson } from '../../modules/widget-props';
import { dayKey } from '../core/cbt';
import { pickQuote, pinQuote, type QuoteState } from '../core/quotes';
import { WIDGET_NAME, mergeWidgetRatings, widgetProps, type QuoteWidgetProps } from '../core/widgetSync';
import QuoteWidget from './QuoteWidget';

const native = Platform.OS === 'ios' || Platform.OS === 'android';

export async function readWidgetProps(): Promise<Partial<QuoteWidgetProps>[]> {
  if (!native) return [];
  try {
    if (Platform.OS === 'ios') return (await QuoteWidget.getTimeline()).map((e) => e.props);
    const json = getWidgetPropsJson(WIDGET_NAME);
    return json ? [JSON.parse(json)] : [];
  } catch {
    return [];
  }
}

export async function pullWidgetRatings(state: QuoteState) {
  return mergeWidgetRatings(state, await readWidgetProps());
}

/* Pins today's saying (and on iOS the next 6 days) and pushes it to the widget. Returns the new quote state. */
export function pushWidget(state: QuoteState, now = Date.now()): QuoteState {
  const today = dayKey(now);
  const next = pinQuote(state, today).state;
  if (!native) return next;
  try {
    if (Platform.OS === 'ios') {
      const entries: { date: Date; props: QuoteWidgetProps }[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() + i);
        if (i > 0) d.setHours(0, 0, 5, 0);
        const day = dayKey(d);
        // Future days are picked but not pinned, so a rating made before then can still change them.
        const q = pickQuote(day, next);
        entries.push({ date: i === 0 ? new Date(now) : d, props: widgetProps(q, day, next) });
      }
      QuoteWidget.updateTimeline(entries);
    } else {
      QuoteWidget.updateSnapshot(widgetProps(pickQuote(today, next), today, next));
    }
  } catch {
    // The widget is optional. The app works the same without it.
  }
  return next;
}

/* While the app runs, mirror widget taps right away. */
export function listenToWidget(onTap: () => void) {
  if (!native) return () => {};
  try {
    const sub = addUserInteractionListener((e) => {
      if (e.source === WIDGET_NAME) onTap();
    });
    return () => sub.remove();
  } catch {
    return () => {};
  }
}
