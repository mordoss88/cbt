/* Log a try of a ladder step: prediction first, then the highest anxiety and what really happened. */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { useStore } from '../data/store';
import { Badge, Btn, Comic, Field, Hand, P, Page, Panel, Rating, Row } from '../ui/kit';
import { C, F } from '../ui/theme';

export default function TryScreen() {
  const { step: stepId } = useLocalSearchParams<{ step: string }>();
  const { data, addTry, setStepDone } = useStore();
  const step = data.ladder.find((s) => s.id === stepId);
  const [phase, setPhase] = useState<'before' | 'after' | 'saved'>('before');
  const [predicted, setPredicted] = useState('');
  const [peak, setPeak] = useState<number | null>(null);
  const [happened, setHappened] = useState('');
  const [noSafety, setNoSafety] = useState(false);
  if (!step) return <Page><P>This step was deleted.</P></Page>;
  const ready = phase === 'saved' && typeof peak === 'number' && peak <= step.rating / 2;

  return (
    <Page>
      <Comic bg={C.sky} inner={{ gap: 8 }}>
        <Hand size={22}>{step.text}</Hand>
        <Row><Badge v={step.rating} /><P bold>Your rating</P></Row>
      </Comic>
      {phase === 'before' ? (
        <>
          <Panel>
            <Field label="Before: what do you predict will happen?" value={predicted} onChangeText={setPredicted} placeholder="For example: I will panic and have to stop" />
          </Panel>
          <P muted>Now do the step. Stay until the anxiety starts to drop, if you can. Quick help is at the bottom if you need it.</P>
          <Btn kind="primary" title="I did it, log how it went" onPress={() => setPhase('after')} />
        </>
      ) : null}
      {phase === 'after' ? (
        <>
          <Panel>
            <Rating label="Your highest anxiety during the step" value={peak} onChange={setPeak} />
            <Field label="What really happened?" value={happened} onChangeText={setHappened} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Switch value={noSafety} onValueChange={setNoSafety} accessibilityLabel="I did it without safety behaviors" />
              <Text style={{ fontFamily: F.bodySemi, fontSize: 15, color: C.ink, flex: 1 }}>I did it without safety behaviors</Text>
            </View>
          </Panel>
          <Btn kind="primary" title="Save the try" disabled={peak === null}
            onPress={async () => { await addTry(step.id, { peak, predicted, happened, noSafety }); setPhase('saved'); }} />
        </>
      ) : null}
      {phase === 'saved' ? (
        <Panel sticker="Saved" stickerBg={C.calm}>
          <P>Well done. Every try teaches your brain that you can handle this.</P>
          {predicted ? <P muted>You predicted: “{predicted}”. Compare it with what happened.</P> : null}
          {ready ? <P bold style={{ color: C.skyDeep }}>Your highest anxiety was half of the rating or less. You can mark this step done and go one step up.</P> : null}
          <Row>
            {ready ? <Btn kind="primary" title="Mark done" onPress={async () => { await setStepDone(step.id, true); router.back(); }} /> : null}
            <Btn title="Close" onPress={() => router.back()} />
          </Row>
        </Panel>
      ) : null}
    </Page>
  );
}
