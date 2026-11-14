import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { ladderList, nextStep, readyToMarkDone, sortStepsHardestFirst, stepsOf } from '../../core/cbt';
import { useStore } from '../../data/store';
import { fmtDay } from '../../ui/copy';
import { Badge, Btn, Comic, Hand, P, Page, Panel, Row, Sticker } from '../../ui/kit';
import { C, F } from '../../ui/theme';

export default function LadderTab() {
  const { data, addLadder, setStepDone } = useStore();
  const ladders = ladderList(data.ladders);
  const [cur, setCur] = useState(ladders[0].id);
  const [newName, setNewName] = useState<string | null>(null);
  const active = ladders.find((l) => l.id === cur) ?? ladders[0];
  const steps = stepsOf(data.ladder, data.ladders, active.id);
  const next = nextStep(steps);
  return (
    <Page>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {ladders.map((l) => (
          <Pressable key={l.id} onPress={() => setCur(l.id)} accessibilityRole="tab" accessibilityState={{ selected: l.id === active.id }}
            style={{ backgroundColor: l.id === active.id ? C.sky : C.paper, borderColor: C.ink, borderWidth: 2.5, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 }}>
            <Text style={{ fontFamily: F.display, fontSize: 15, color: C.ink }}>{l.name}</Text>
          </Pressable>
        ))}
        {newName === null ? <Btn small kind="ghost" title="+ New ladder" onPress={() => setNewName('')} /> : null}
      </View>
      {newName !== null ? (
        <Comic bg={C.paper} inner={{ gap: 8 }}>
          <P bold>Name the fear, for example “Driving” or “Social”</P>
          <TextInput value={newName} onChangeText={setNewName} autoFocus accessibilityLabel="Ladder name"
            style={{ fontFamily: F.hand, fontSize: 20, borderColor: C.ink, borderWidth: 2.5, borderRadius: 12, padding: 10, backgroundColor: '#fff' }} />
          <Row>
            <Btn small kind="primary" title="Add ladder" onPress={async () => { const l = await addLadder(newName); setCur(l.id); setNewName(null); }} />
            <Btn small kind="ghost" title="Cancel" onPress={() => setNewName(null)} />
          </Row>
        </Comic>
      ) : null}

      {next ? (
        <Pressable onPress={() => router.push(`/try?step=${next.id}`)} accessibilityRole="button" accessibilityLabel={`Your next step: ${next.text}. Log a try.`}>
          <Comic bg={C.sky} inner={{ gap: 8 }}>
            <Sticker bg={C.panel}>Your next step</Sticker>
            <Hand size={22}>{next.text}</Hand>
            <Row><Badge v={next.rating} /><P bold>Tap to log a try</P></Row>
          </Comic>
        </Pressable>
      ) : (
        <Panel sticker="Start here" stickerBg={C.calm}>
          <P>A fear ladder lists situations you avoid, rated from 0 (easy) to 100 (hardest). Start at the bottom and go up one step at a time.</P>
        </Panel>
      )}

      <Row>
        <Btn kind="primary" title="Write a step" onPress={() => router.push(`/step?ladder=${active.id}`)} />
        <Btn title="Ideas" onPress={() => router.push(`/step?ladder=${active.id}&ideas=1`)} />
      </Row>

      {sortStepsHardestFirst(steps).map((s) => {
        const last = s.tries?.[s.tries.length - 1];
        const ready = readyToMarkDone(s);
        return (
          <Comic key={s.id} bg={s.done ? C.calm : C.panel2} shadow={3} inner={{ gap: 8, padding: 14 }}>
            <Row wrap={false}>
              <Badge v={s.rating} />
              <View style={{ flex: 1 }}><Hand size={19}>{s.text}</Hand></View>
              {s.done ? <Sticker tiny bg={C.paper}>Done</Sticker> : null}
            </Row>
            <P muted>{(s.tries?.length ?? 0) === 0 ? 'Not tried yet.' : `${s.tries!.length} ${s.tries!.length === 1 ? 'try' : 'tries'}. Last: ${fmtDay(Date.parse(last!.at))}, highest anxiety ${last!.peak ?? '–'}.`}</P>
            {ready ? <P bold style={{ color: C.skyDeep }}>Your anxiety dropped to half or less. Ready to mark it done and go one step up?</P> : null}
            <Row>
              {!s.done ? <Btn small title="Log a try" onPress={() => router.push(`/try?step=${s.id}`)} /> : null}
              <Btn small kind={ready ? 'primary' : 'ghost'} title={s.done ? 'Not done yet' : 'Mark done'} onPress={() => setStepDone(s.id, !s.done)} />
              <Btn small kind="ghost" title="Edit" onPress={() => router.push(`/step?id=${s.id}`)} />
            </Row>
          </Comic>
        );
      })}
    </Page>
  );
}
