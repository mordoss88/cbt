/* Android home-screen widget (Glance through expo-widgets). Same props and behavior as QuoteWidget.ios.tsx.
   Android widgets support only Box, Column, Row, Spacer, Text and the button components, and a few modifiers.
   The function body runs in the widget runtime: no hooks, no runtime imports, no outside constants. */
import { Button, Column, OutlinedButton, Row, Spacer, Text } from '@expo/ui/jetpack-compose';
import { background, cornerRadius, fillMaxSize, fillMaxWidth, height, paddingAll, width } from '@expo/ui/jetpack-compose/modifiers';
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
  const targetUp: any = { target: 'rate-up' };
  const targetDown: any = { target: 'rate-down' };
  const upOn = props.rating === 'up';
  const downOn = props.rating === 'down';

  return (
    <Column modifiers={[fillMaxSize(), background('#FFD36E'), cornerRadius(20), paddingAll(14)]}>
      <Text color="#5B3F4A" style={{ fontSize: 11, fontWeight: 'bold' }}>SAYING OF THE DAY</Text>
      <Spacer modifiers={[height(6)]} />
      <Text color={ink} maxLines={4} style={{ fontSize: 17, fontWeight: 'bold' }}>{text}</Text>
      <Spacer modifiers={[height(10)]} />
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
