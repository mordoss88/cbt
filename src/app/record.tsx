/* Thought record in two parts. Part 1 in the moment, Part 2 later when calm. */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { BODY, SAFETY, TRAPS, ratingChange } from '../core/cbt';
import type { ThoughtRecord } from '../core/types';
import { useStore } from '../data/store';
import { Btn, Chips, Comic, Field, Hand, P, Page, Panel, Rating, Row, Sticker } from '../ui/kit';
import { C } from '../ui/theme';

export default function RecordScreen() {
  const { id, part } = useLocalSearchParams<{ id?: string; part?: string }>();
  const { data, saveRecord } = useStore();
  const existing = id ? data.records.find((r) => r.id === id) : undefined;
  const [r, setR] = useState<ThoughtRecord>(() => existing ?? { id: '', kind: 'record', when: new Date().toISOString(), sensations: [], safety: [], traps: [] });
  const [step, setStep] = useState<1 | 2>(part === '2' ? 2 : 1);
  const set = (p: Partial<ThoughtRecord>) => setR((x) => ({ ...x, ...p }));

  const save = async (next?: 1 | 2) => {
    if (!r.situation?.trim() && !r.thought?.trim() && typeof r.anxietyBefore !== 'number') {
      Alert.alert('Nothing to save yet', 'Write what happened or the thought first.');
      return;
    }
    const saved = await saveRecord(r);
    setR(saved);
    if (next === 2) setStep(2);
    else router.back();
  };
  const change = ratingChange(r.anxietyBefore, r.anxietyAfter);

  if (step === 1) {
    return (
      <Page>
        <Sticker bg={C.berry}>Part 1 · In the moment</Sticker>
        <Panel>
          <Field label="What happened? Where were you?" value={r.situation} onChangeText={(t) => set({ situation: t })} placeholder="For example: the daily call, I had to talk" />
          <Rating label="How anxious are you? (0-100)" value={r.anxietyBefore} onChange={(v) => set({ anxietyBefore: v })} />
        </Panel>
        <Panel title="What do you feel in your body?">
          <Chips options={BODY.map((b) => ({ k: b, label: b }))} value={r.sensations ?? []} onChange={(v) => set({ sensations: v })} />
        </Panel>
        <Panel>
          <Field label="What went through your mind?" value={r.thought} onChangeText={(t) => set({ thought: t })} placeholder="The thought, in your own words" />
          <Rating label="How much do you believe it? (0-100)" value={r.beliefBefore} onChange={(v) => set({ beliefBefore: v })} low="Not at all" high="Completely" />
        </Panel>
        <Panel title="What did you do to feel safe?">
          <Chips options={SAFETY.map((b) => ({ k: b, label: b }))} value={r.safety ?? []} onChange={(v) => set({ safety: v })} />
          <Field label="Something else" value={r.safetyOther} onChangeText={(t) => set({ safetyOther: t })} multiline={false} />
        </Panel>
        <Row>
          <Btn kind="primary" title="Save" onPress={() => save()} />
          <Btn title="Save and do Part 2 now" onPress={() => save(2)} />
        </Row>
        <P muted>You can do Part 2 later, when you are calm. The Today card reminds you.</P>
      </Page>
    );
  }

  return (
    <Page>
      <Sticker bg={C.sky}>Part 2 · When you are calm</Sticker>
      <Comic bg={C.paper} inner={{ gap: 6 }}>
        <Sticker tiny bg={C.panel}>From Part 1</Sticker>
        {r.thought ? <Hand>“{r.thought}”</Hand> : null}
        <P muted>{typeof r.anxietyBefore === 'number' ? `Anxiety then: ${r.anxietyBefore}. ` : ''}{typeof r.beliefBefore === 'number' ? `You believed it: ${r.beliefBefore}.` : ''}</P>
      </Comic>
      <Panel title="Which thinking traps do you see?">
        <Chips options={TRAPS.map((t) => ({ k: t.k, label: t.name }))} value={r.traps ?? []} onChange={(v) => set({ traps: v })} />
        <P muted>{TRAPS.filter((t) => (r.traps ?? []).includes(t.k)).map((t) => `${t.name}: ${t.d}`).join('\n')}</P>
      </Panel>
      <Panel>
        <Field label="Facts that support the thought" value={r.evidenceFor} onChangeText={(t) => set({ evidenceFor: t })} />
        <Field label="Facts against the thought" value={r.evidenceAgainst} onChangeText={(t) => set({ evidenceAgainst: t })} />
        <Field label="A balanced thought" value={r.balanced} onChangeText={(t) => set({ balanced: t })} placeholder="What is a fairer way to see it?" />
        <Rating label="How much do you believe the first thought now?" value={r.beliefAfter} onChange={(v) => set({ beliefAfter: v })} low="Not at all" high="Completely" />
      </Panel>
      <Panel>
        <Field label="What really happened?" value={r.outcome} onChangeText={(t) => set({ outcome: t })} />
        <Rating label="How anxious are you now?" value={r.anxietyAfter} onChange={(v) => set({ anxietyAfter: v })}
          hint={change && change.after !== null ? change.text : change ? change.text : undefined} />
      </Panel>
      <Row>
        <Btn kind="primary" title="Save" onPress={() => save()} />
        <Btn kind="ghost" title="Back to Part 1" onPress={() => setStep(1)} />
      </Row>
    </Page>
  );
}
