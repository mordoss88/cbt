import { router } from 'expo-router';
import { Platform } from 'react-native';
import { useStore } from '../../data/store';
import { ratedList } from '../../core/quotes';
import { Btn, Bullets, P, Page, Panel } from '../../ui/kit';
import { C } from '../../ui/theme';

export default function MoreTab() {
  const { quotes } = useStore();
  const liked = ratedList(quotes, 'up').length;
  return (
    <Page>
      <Panel title="Your sayings" sticker="Daily" stickerBg={C.calm}>
        <P>{liked ? `${liked} sayings help you. They come back more often.` : 'Rate the saying of the day to shape which ones come back.'}</P>
        <Btn title="Your sayings" onPress={() => router.push('/sayings')} />
      </Panel>
      <Panel title="Home-screen widget">
        <Bullets items={[
          Platform.OS === 'ios'
            ? 'Touch and hold the home screen, tap **Edit**, then **Add Widget**, and pick **CBT Practice Log**.'
            : 'Touch and hold the home screen, tap **Widgets**, and pick **CBT Practice Log**.',
          'Rate the saying right on the widget. The app saves the rating the next time it opens.',
          'The widget shows only the saying, never your entries.',
        ]} />
      </Panel>
      <Panel title="Move your data from the tracker">
        <P>Bring your entries, ladders, check-ins, self-checks and coach notes from the CBT Practice Log tracker.</P>
        <Btn kind="primary" title="Import from tracker" onPress={() => router.push('/import')} />
      </Panel>
      <Panel title="Help and privacy">
        <Btn title="How to use" onPress={() => router.push('/guide')} />
        <Btn title="About, privacy and your data" onPress={() => router.push('/about')} />
      </Panel>
      <P muted>Self-help, not treatment. Not for emergencies: use Quick help.</P>
    </Page>
  );
}
