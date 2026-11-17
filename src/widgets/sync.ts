/* Keeps the home-screen widget and the app in step.
   - pull: read ratings made on the widget (iOS: the widget timeline; Android: stored props through the local module).
   - push: show today's saying (iOS also gets the next 7 days, so the widget changes daily without the app).
   Only the saying goes to the widget. No entries or other personal data. */
import { Platform } from 'react-native';
import { addUserInteractionListener } from 'expo-widgets';
import { getWidgetPropsJson } from '../../modules/widget-props';
import { pickQuote, pinQuote, type QuoteState } from '../core/quotes';
import { WIDGET_NAME, mergeWidgetRatings, nextDayKeys, widgetProps, widgetSchedule, type QuoteWidgetProps } from '../core/widgetSync';
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

/* Pins today's saying and pushes today and the next 13 days to the widget, so it changes daily without the app.
   iOS gets a timeline entry for each midnight. Android gets the list and picks today's entry when it draws.
   Returns the new quote state. */
export function pushWidget(state: QuoteState, now = Date.now()): QuoteState {
  const keys = nextDayKeys(now);
  const today = keys[0];
  const next = pinQuote(state, today).state;
  if (!native) return next;
  try {
    // Future days are picked but not pinned, so a rating made before then can still change them.
    const days = widgetSchedule(next, keys);
    const props = widgetProps(pickQuote(today, next), today, next, days);
    if (Platform.OS === 'ios') {
      QuoteWidget.updateTimeline(days.map(([day, id, text, rating], i) => {
        const d = new Date(now);
        if (i > 0) { d.setDate(d.getDate() + i); d.setHours(0, 0, 5, 0); }
        return { date: d, props: { ...props, quoteId: id, text, day, rating } };
      }));
    } else {
      QuoteWidget.updateSnapshot(props);
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
