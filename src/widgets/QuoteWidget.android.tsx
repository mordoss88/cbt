/* Android home-screen widget (Glance through expo-widgets). Same props and behavior as QuoteWidget.ios.tsx.
   Compact: one row of the home screen (4x1, resizable). The saying (2 lines, sayings are at most 78 characters) and two small buttons.
   Android widgets support only Box, Column, Row, Spacer, Text and the button components, and a few modifiers.
   The function body runs in the widget runtime: no hooks, no runtime imports, no outside constants. */
import { Button, Column, OutlinedButton, Row, Spacer, Text } from '@expo/ui/jetpack-compose';
import { background, cornerRadius, fillMaxSize, fillMaxWidth, height, padding, width } from '@expo/ui/jetpack-compose/modifiers';
import { createWidget } from 'expo-widgets';
import type { QuoteWidgetProps } from '../core/widgetSync';

const QuoteWidget = (props: QuoteWidgetProps) => {
  'widget';
  const ink = '#2B1D2E';
  const text = props.text || 'Open the app to get your saying for today.';
  const rate = (rating: 'up' | 'down') => ({
    ...props,
    rating,
    pending: (props.pending ? props.pending + ';' : '') + props.quoteId + ':' + rating + ':' + Date.now(),
  });
  // `target` names the button for the press handler and the app's interaction listener.
  const targetUp: any = { target: 'rate-up', modifiers: [height(34)] };
  const targetDown: any = { target: 'rate-down', modifiers: [height(34)] };
  const upOn = props.rating === 'up';
  const downOn = props.rating === 'down';

  return (
    <Column modifiers={[fillMaxSize(), background('#FFD36E'), cornerRadius(18), padding(12, 8, 12, 8)]}>
      <Text color={ink} maxLines={2} style={{ fontSize: 15, fontWeight: 'bold' }}>{text}</Text>
      <Spacer modifiers={[height(4)]} />
      {props.quoteId ? (
        <Row modifiers={[fillMaxWidth()]}>
          {upOn ? (
            <Button {...targetUp} colors={{ containerColor: '#1F7F72', contentColor: '#FFFFFF' }} onClick={(() => rate('up')) as any}>
              <Text>Helps ✓</Text>
            </Button>
          ) : (
            <OutlinedButton {...targetUp} colors={{ contentColor: '#1F7F72' }} onClick={(() => rate('up')) as any}>
              <Text>Helps</Text>
            </OutlinedButton>
          )}
          <Spacer modifiers={[width(8)]} />
          {downOn ? (
            <Button {...targetDown} colors={{ containerColor: '#8A1C30', contentColor: '#FFFFFF' }} onClick={(() => rate('down')) as any}>
              <Text>Not for me ✓</Text>
            </Button>
          ) : (
            <OutlinedButton {...targetDown} colors={{ contentColor: '#8A1C30' }} onClick={(() => rate('down')) as any}>
              <Text>Not for me</Text>
            </OutlinedButton>
          )}
        </Row>
      ) : null}
    </Column>
  );
};

export default createWidget<QuoteWidgetProps>('QuoteWidget', QuoteWidget, {
  quoteId: '', text: '', day: '', rating: '', pending: '', url: 'cbtlog://today',
});
