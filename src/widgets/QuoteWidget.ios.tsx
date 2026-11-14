/* iOS home-screen widget (WidgetKit through expo-widgets). Shows the saying of the day and two rating buttons.
   The function body runs in the widget runtime: no hooks, no imports at runtime, no outside constants.
   Keep it in step with QuoteWidget.android.tsx. */
import { Button, HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  buttonStyle, containerBackground, font, foregroundStyle, lineLimit, minimumScaleFactor, padding, tint, widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { QuoteWidgetProps } from '../core/widgetSync';

const QuoteWidget = (props: QuoteWidgetProps, environment: WidgetEnvironment) => {
  'widget';
  const ink = '#2B1D2E';
  const panel = '#FFD36E';
  const small = environment.widgetFamily === 'systemSmall';
  const lock = environment.widgetFamily === 'accessoryRectangular' || environment.widgetFamily === 'accessoryInline';
  const text = props.text || 'Open the app to get your saying for today.';
  const rate = (rating: 'up' | 'down') => ({
    ...props,
    rating,
    pending: (props.pending ? props.pending + ';' : '') + props.quoteId + ':' + rating + ':' + Date.now(),
  });

  if (lock) {
    return (
      <VStack modifiers={[containerBackground('clear', 'widget'), widgetURL(props.url || 'cbtlog://today')]}>
        <Text modifiers={[font({ size: 13, weight: 'semibold' }), lineLimit(3), minimumScaleFactor(0.7)]}>{text}</Text>
      </VStack>
    );
  }

  return (
    <VStack
      alignment="leading"
      spacing={small ? 6 : 8}
      modifiers={[containerBackground(panel, 'widget'), widgetURL(props.url || 'cbtlog://today')]}>
      <Text modifiers={[font({ size: 11, weight: 'bold', design: 'rounded' }), foregroundStyle('#5B3F4A')]}>SAYING OF THE DAY</Text>
      <Text
        modifiers={[
          font({ size: small ? 15 : 18, weight: 'semibold', design: 'rounded' }),
          foregroundStyle(ink),
          lineLimit(small ? 5 : 4),
          minimumScaleFactor(0.75),
        ]}>
        {text}
      </Text>
      <Spacer />
      {props.quoteId ? (
        <HStack spacing={8}>
          <Button
            target="rate-up"
            label={props.rating === 'up' ? 'Helps ✓' : 'Helps'}
            onPress={() => rate('up')}
            modifiers={[buttonStyle(props.rating === 'up' ? 'borderedProminent' : 'bordered'), tint('#1F7F72'), font({ size: 13, weight: 'semibold' })]}
          />
          <Button
            target="rate-down"
            label={small ? (props.rating === 'down' ? 'No ✓' : 'No') : props.rating === 'down' ? 'Not for me ✓' : 'Not for me'}
            onPress={() => rate('down')}
            modifiers={[buttonStyle(props.rating === 'down' ? 'borderedProminent' : 'bordered'), tint('#8A1C30'), font({ size: 13, weight: 'semibold' })]}
          />
        </HStack>
      ) : null}
      {small ? null : <Text modifiers={[padding({ top: 2 }), font({ size: 10 }), foregroundStyle('#5B3F4A')]}>Tap to open. Quick help is one tap away.</Text>}
    </VStack>
  );
};

export default createWidget<QuoteWidgetProps>('QuoteWidget', QuoteWidget, {
  quoteId: '', text: '', day: '', rating: '', pending: '', url: 'cbtlog://today',
});
