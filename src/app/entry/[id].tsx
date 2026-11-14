import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { isJournal, needsPart2, ratingChange, trapName } from '../../core/cbt';
import { useStore } from '../../data/store';
import { fmtWhen } from '../../ui/copy';
import { Badge, Btn, Comic, Hand, P, Page, Row, Sticker, ThoughtBubble } from '../../ui/kit';
import { C } from '../../ui/theme';

function Line({ label, value }: { label: string; value?: string | null }) {
  if (!value || !String(value).trim()) return null;
  return (
    <View style={{ gap: 2 }}>
      <P bold>{label}</P>
      <Hand size={19}>{value}</Hand>
    </View>
  );
}

export default function EntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, removeRecord } = useStore();
  const [confirm, setConfirm] = useState(false);
  const r = data.records.find((x) => x.id === id);
  if (!r) return <Page><P>This entry was deleted.</P></Page>;
  const change = ratingChange(r.anxietyBefore, r.anxietyAfter);
  const journal = isJournal(r);
  return (
    <Page>
      <Row>
        <Badge v={r.anxietyBefore} />
        {typeof r.anxietyAfter === 'number' ? <Badge v={r.anxietyAfter} /> : null}
        <P muted>{fmtWhen(r.when || r.createdAt)}</P>
      </Row>
      {change?.after !== null && change ? <P bold style={{ color: C.skyDeep }}>{change.text}</P> : null}
      <Comic bg={journal ? C.paper : C.panel2} inner={{ gap: 12 }}>
        {journal ? <Hand>{r.text}</Hand> : (
          <>
            <Line label="What happened" value={r.situation} />
            {r.thought ? <ThoughtBubble>{r.thought}</ThoughtBubble> : null}
            {typeof r.beliefBefore === 'number' ? <P muted>Believed: {r.beliefBefore}{typeof r.beliefAfter === 'number' ? ` → ${r.beliefAfter}` : ''}</P> : null}
            <Line label="In my body" value={(r.sensations ?? []).join(', ')} />
            <Line label="To feel safe I" value={[...(r.safety ?? []), r.safetyOther].filter(Boolean).join(', ')} />
            <Line label="Thinking traps" value={(r.traps ?? []).map(trapName).join(', ')} />
            <Line label="Facts for" value={r.evidenceFor} />
            <Line label="Facts against" value={r.evidenceAgainst} />
            <Line label="Balanced thought" value={r.balanced} />
            <Line label="What really happened" value={r.outcome} />
          </>
        )}
      </Comic>
      {needsPart2(r) ? (
        <Comic bg={C.mid} shadow={3}>
          <Sticker tiny bg={C.paper}>Part 2 open</Sticker>
          <View style={{ height: 6 }} />
          <P>When you are calm, test the thought against the facts.</P>
          <View style={{ height: 8 }} />
          <Btn kind="primary" title="Do Part 2" onPress={() => router.replace(`/record?id=${r.id}&part=2`)} />
        </Comic>
      ) : null}
      <Row>
        <Btn title="Edit" onPress={() => router.replace(journal ? `/journal?id=${r.id}` : `/record?id=${r.id}`)} />
        {confirm ? (
          <Btn kind="danger" title="Yes, delete" onPress={async () => { await removeRecord(r.id); router.back(); }} />
        ) : (
          <Btn kind="ghost" title="Delete" onPress={() => setConfirm(true)} />
        )}
      </Row>
    </Page>
  );
}
