/* Android home-screen widget (Glance through expo-widgets). Same props and behavior as QuoteWidget.ios.tsx.
   It shows today's entry of `days`, so the saying changes daily without the app (see plugins/with-widget-refresh.js).
   Compact: one row of the home screen (4x1, resizable). The saying (2 lines, sayings are at most 78 characters) and two small buttons.
   Android widgets support only Box, Column, Row, Spacer, Text and the button components, and a few modifiers.
   The function body runs in the widget runtime: no hooks, no runtime imports, no outside constants. */
import { Button, Column, Row, Spacer, Text } from '@expo/ui/jetpack-compose';
import { background, cornerRadius, fillMaxSize, fillMaxWidth, height, padding, width } from '@expo/ui/jetpack-compose/modifiers';
import { createWidget } from 'expo-widgets';
import type { QuoteWidgetProps } from '../core/widgetSync';

const QuoteWidget = (props: QuoteWidgetProps) => {
  'widget';
  const ink = '#2B1D2E';
  // Pick today's saying from the list the app sent (same rule as widgetDayFor in core/widgetSync.ts).
  // The widget redraws about once an hour, so a new day shows a new saying even when the app stays closed.
  let days: [string, string, string, string][] = [];
  try { days = props.days ? JSON.parse(props.days) : []; } catch { days = []; }
  const now = new Date();
  const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  let entry: [string, string, string, string] | null = null;
  for (const d of days) if (d[0] <= today) entry = d;
  if (!entry && days.length) entry = days[0];
  const quoteId = entry ? entry[1] : props.quoteId;
  const text = (entry ? entry[2] : props.text) || 'Open the app to get your saying for today.';
  const shownRating = entry ? entry[3] : props.rating;
  const rate = (rating: 'up' | 'down') => ({
    ...props,
    rating,
    days: entry ? JSON.stringify(days.map((d) => (d[1] === quoteId ? [d[0], d[1], d[2], rating] : d))) : props.days,
    pending: (props.pending ? props.pending + ';' : '') + quoteId + ':' + rating + ':' + Date.now(),
  });
  // Buttons draw their own colored pill: a Row inside the button, so the label is a real Text with our color.
  // (A button with only a Text child becomes a Glance button whose label color can match its own background,
  // which showed as blank teal and red pills on the phone.)
  // `target` names the button for the press handler and the app's interaction listener.
  const pill = (on: boolean, color: string, target: string): any => ({
    target,
    colors: { containerColor: on ? color : '#FFF4D6', contentColor: on ? '#FFFFFF' : color },
    modifiers: [height(32), cornerRadius(16)],
  });
  const upOn = shownRating === 'up';
  const downOn = shownRating === 'down';

  return (
    <Column verticalArrangement="center" modifiers={[fillMaxSize(), background('#FFD36E'), cornerRadius(18), padding(12, 6, 12, 6)]}>
      <Text color={ink} maxLines={2} style={{ fontSize: 15, fontWeight: 'bold' }}>{text}</Text>
      <Spacer modifiers={[height(6)]} />
      {quoteId ? (
        <Row modifiers={[fillMaxWidth()]}>
          <Button {...pill(upOn, '#1F7F72', 'rate-up')} onClick={(() => rate('up')) as any}>
            <Row verticalAlignment="center" modifiers={[height(32), padding(14, 0, 14, 0)]}>
              <Text color={upOn ? '#FFFFFF' : '#1F7F72'} style={{ fontSize: 13, fontWeight: 'bold' }}>{upOn ? 'Helps ✓' : 'Helps'}</Text>
            </Row>
          </Button>
          <Spacer modifiers={[width(8)]} />
          <Button {...pill(downOn, '#8A1C30', 'rate-down')} onClick={(() => rate('down')) as any}>
            <Row verticalAlignment="center" modifiers={[height(32), padding(14, 0, 14, 0)]}>
              <Text color={downOn ? '#FFFFFF' : '#8A1C30'} style={{ fontSize: 13, fontWeight: 'bold' }}>{downOn ? 'Not for me ✓' : 'Not for me'}</Text>
            </Row>
          </Button>
        </Row>
      ) : null}
    </Column>
  );
};

export default createWidget<QuoteWidgetProps>('QuoteWidget', QuoteWidget, {
  quoteId: '', text: '', day: '', rating: '', pending: '', url: 'cbtlog://today', days: '',
});
