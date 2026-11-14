import { router } from 'expo-router';
import { useState } from 'react';
import { useStore } from '../data/store';
import { Btn, P, Page, Panel, Rating } from '../ui/kit';

export default function CheckinScreen() {
  const { addCheckin } = useStore();
  const [v, setV] = useState({ anxiety: 5, interfere: 5, avoid: 5 });
  return (
    <Page>
      <P>About your last 7 days. 30 seconds.</P>
      <Panel>
        <Rating label="How anxious did you feel?" value={v.anxiety} max={10} step={1} low="Not at all" high="Very" onChange={(x) => setV({ ...v, anxiety: x })} />
        <Rating label="How much did anxiety get in the way of your life?" value={v.interfere} max={10} step={1} low="Not at all" high="A lot" onChange={(x) => setV({ ...v, interfere: x })} />
        <Rating label="How much did you avoid things because of anxiety?" value={v.avoid} max={10} step={1} low="Not at all" high="A lot" onChange={(x) => setV({ ...v, avoid: x })} />
      </Panel>
      <Btn kind="primary" title="Save check-in" onPress={async () => { await addCheckin(v); router.back(); }} />
    </Page>
  );
}
