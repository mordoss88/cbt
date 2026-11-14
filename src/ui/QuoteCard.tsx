/* The saying of the day, with Helps / Not for me. The same saying is on the home-screen widget. */
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { dayKey } from '../core/cbt';
import { pickQuote } from '../core/quotes';
import { useStore } from '../data/store';
import { useNow } from './useNow';
import { Btn, Comic, Hand, P, Row, Sticker } from './kit';
import { C, F } from './theme';

export function QuoteCard() {
  const { quotes, rate } = useStore();
  const now = useNow();
  const q = pickQuote(dayKey(now), quotes);
  const r = quotes.ratings[q.id]?.rating;
  return (
    <Comic bg={C.paper} inner={{ gap: 10 }}>
      <Sticker bg={C.calm}>Saying of the day</Sticker>
      <Hand size={24}>{q.text}</Hand>
      <P muted>{q.why}</P>
      <Row>
        <Btn small kind={r === 'up' ? 'primary' : 'plain'} title={r === 'up' ? 'Helps ✓' : 'Helps'} onPress={() => rate(q.id, r === 'up' ? null : 'up')}
          accessibilityLabel={r === 'up' ? 'Helps, selected. Tap to clear.' : 'This saying helps'} />
        <Btn small kind={r === 'down' ? 'danger' : 'plain'} title={r === 'down' ? 'Not for me ✓' : 'Not for me'} onPress={() => rate(q.id, r === 'down' ? null : 'down')}
          accessibilityLabel={r === 'down' ? 'Not for me, selected. Tap to clear.' : 'This saying is not for me'} />
        <Btn small kind="ghost" title="Your sayings" onPress={() => router.push('/sayings')} />
      </Row>
      {r === 'down' ? (
        <View><Text style={{ fontFamily: F.bodySemi, fontSize: 14, color: C.inkSoft }}>Got it. This one will not come back. You get a new saying tomorrow.</Text></View>
      ) : null}
    </Comic>
  );
}
