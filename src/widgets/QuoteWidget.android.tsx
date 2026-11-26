/* Android home-screen widget (Glance through expo-widgets). Same props and behavior as QuoteWidget.ios.tsx.
   It shows today's entry of `days`, so the saying changes daily without the app (see plugins/with-widget-refresh.js).
   Resizable: from 2x1 up to the whole screen. It starts at 4x1. The layout uses the size the launcher gives
   (`environment.width` and `environment.height` in dp, added by scripts/patch-expo-widgets.js): more lines and bigger text
   when it is taller, a "Saying for today" title when there is room, short button labels when it is narrow.
   Without a size (older build, or a button press) it uses the compact 2-line layout. Same button targets in every layout.
   Android widgets support only Box, Column, Row, Spacer, Text and the button components, and a few modifiers.
   The function body runs in the widget runtime: no hooks, no runtime imports, no outside constants. */
import { Button, Column, Row, Spacer, Text } from '@expo/ui/jetpack-compose';
import { background, cornerRadius, fillMaxSize, fillMaxWidth, height, padding, width } from '@expo/ui/jetpack-compose/modifiers';
import { createWidget } from 'expo-widgets';
import type { QuoteWidgetProps } from '../core/widgetSync';

const QuoteWidget = (props: QuoteWidgetProps, environment?: any) => {
  'widget';
  const ink = '#2B1D2E';
  // Size in dp, 0 when unknown. Fixed parts: 12 padding, 6 gap, 32 buttons = 50.
  const w = Number(environment && environment.width) || 0;
  const h = Number(environment && environment.height) || 0;
  const tall = h >= 110;
  const titled = h >= 170;
  const narrow = w > 0 && w < 210;
  const fontSize = tall ? 18 : 15;
  const lineHeight = tall ? 24 : 20;
  const lines = h ? Math.max(1, Math.min(10, Math.floor((h - 50 - (titled ? 22 : 0)) / lineHeight))) : 2;
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
      {titled ? <Text color={ink} maxLines={1} style={{ fontSize: 12 }}>Saying for today</Text> : null}
      {titled ? <Spacer modifiers={[height(6)]} /> : null}
      <Text color={ink} maxLines={lines} style={{ fontSize, fontWeight: 'bold' }}>{text}</Text>
      <Spacer modifiers={[height(6)]} />
      {quoteId ? (
        <Row modifiers={[fillMaxWidth()]}>
          <Button {...pill(upOn, '#1F7F72', 'rate-up')} onClick={(() => rate('up')) as any}>
            <Row verticalAlignment="center" modifiers={[height(32), padding(narrow ? 10 : 14, 0, narrow ? 10 : 14, 0)]}>
              <Text color={upOn ? '#FFFFFF' : '#1F7F72'} style={{ fontSize: 13, fontWeight: 'bold' }}>{(narrow ? '👍' : 'Helps') + (upOn ? ' ✓' : '')}</Text>
            </Row>
          </Button>
          <Spacer modifiers={[width(8)]} />
          <Button {...pill(downOn, '#8A1C30', 'rate-down')} onClick={(() => rate('down')) as any}>
            <Row verticalAlignment="center" modifiers={[height(32), padding(narrow ? 10 : 14, 0, narrow ? 10 : 14, 0)]}>
              <Text color={downOn ? '#FFFFFF' : '#8A1C30'} style={{ fontSize: 13, fontWeight: 'bold' }}>{(narrow ? '👎' : 'Not for me') + (downOn ? ' ✓' : '')}</Text>
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
