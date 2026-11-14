/* Your sayings: the ones that help, and the ones you hid. Ratings can be changed here. */
import { ratedList } from '../core/quotes';
import { useStore } from '../data/store';
import { fmtDay } from '../ui/copy';
import { Btn, Comic, Hand, P, Page, Panel, Row } from '../ui/kit';
import { C } from '../ui/theme';

export default function SayingsScreen() {
  const { quotes, rate } = useStore();
  const up = ratedList(quotes, 'up');
  const down = ratedList(quotes, 'down');
  return (
    <Page>
      <Panel title={`Helps (${up.length})`} sticker="Comes back more often" stickerBg={C.calm}>
        {up.length === 0 ? <P muted>Tap Helps under a saying that speaks to you.</P> : null}
        {up.map((r) => (
          <Comic key={r.id} bg={C.paper} shadow={3} inner={{ gap: 6, padding: 12 }}>
            <Hand size={19}>{r.quote.text}</Hand>
            <P muted>{fmtDay(Date.parse(r.at))}{r.from === 'widget' ? ' · on the widget' : ''}</P>
            <Row><Btn small kind="ghost" title="Remove" onPress={() => rate(r.id, null)} /></Row>
          </Comic>
        ))}
      </Panel>
      <Panel title={`Not for me (${down.length})`} sticker="Does not come back" stickerBg={C.pink}>
        {down.length === 0 ? <P muted>Nothing hidden.</P> : null}
        {down.map((r) => (
          <Comic key={r.id} bg={C.paper} shadow={3} inner={{ gap: 6, padding: 12 }}>
            <Hand size={19}>{r.quote.text}</Hand>
            <Row><Btn small kind="ghost" title="Show it again" onPress={() => rate(r.id, null)} /></Row>
          </Comic>
        ))}
      </Panel>
    </Page>
  );
}
