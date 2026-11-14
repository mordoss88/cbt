import { router } from 'expo-router';
import { GUIDE, GUIDE_CHANGES, GUIDE_UPDATED } from '../core/guide';
import { Btn, Bullets, P, Page, Panel, Rich } from '../ui/kit';

export default function GuideScreen() {
  return (
    <Page>
      <P muted>Updated {GUIDE_UPDATED}</P>
      {GUIDE.map((s) => (
        <Panel key={s.id} title={s.title}>
          {s.blocks.map((b, i) => (Array.isArray(b) ? <Bullets key={i} items={b} /> : <Rich key={i} text={b} />))}
          {s.id === 'quickhelp' ? <Btn small title="Open Quick help now" onPress={() => router.push('/quick-help')} /> : null}
        </Panel>
      ))}
      <Panel title="What changed">
        <Bullets items={GUIDE_CHANGES.map(([d, t]) => `**${d}**: ${t}`)} />
      </Panel>
    </Page>
  );
}
