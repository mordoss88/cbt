/* Add or edit a ladder step, or pick from ideas. */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { STEP_IDEAS, stepsOf } from '../core/cbt';
import { useStore } from '../data/store';
import { Badge, Btn, Comic, Field, Hand, P, Page, Panel, Rating, Row } from '../ui/kit';
import { C } from '../ui/theme';

export default function StepScreen() {
  const { id, ladder, ideas } = useLocalSearchParams<{ id?: string; ladder?: string; ideas?: string }>();
  const { data, saveStep, removeStep } = useStore();
  const existing = id ? data.ladder.find((s) => s.id === id) : undefined;
  const [text, setText] = useState(existing?.text ?? '');
  const [rating, setRating] = useState<number>(existing?.rating ?? 30);
  const [confirm, setConfirm] = useState(false);
  const ladderId = existing?.ladder ?? ladder;

  if (ideas) {
    const have = new Set(stepsOf(data.ladder, data.ladders, ladderId ?? '').map((s) => s.text.toLowerCase()));
    const list = STEP_IDEAS.filter(([t]) => !have.has(t.toLowerCase()));
    return (
      <Page>
        <P>Tap an idea to add it. Change the rating later to fit you.</P>
        {list.map(([t, r]) => (
          <Comic key={t} bg={C.paper} shadow={3} inner={{ gap: 8, padding: 14 }}>
            <Row wrap={false}><Badge v={r} /><Hand size={19}>{t}</Hand></Row>
            <Btn small title="Add" onPress={() => saveStep({ text: t, rating: r, ladder: ladderId })} />
          </Comic>
        ))}
      </Page>
    );
  }

  return (
    <Page>
      <Panel>
        <Field label="A situation you avoid" value={text} onChangeText={setText} placeholder="For example: drive on a field road with someone I trust" />
        <Rating label="How hard does it feel? (0-100)" value={rating} onChange={setRating} low="Easy" high="Hardest" />
      </Panel>
      <P muted>Steps must be safe in real life. The target is the anxiety, not real danger. For driving: only when it is legal for you, start where there is no traffic, and pull over safely first if panic gets strong.</P>
      <Row>
        <Btn kind="primary" title="Save step" disabled={!text.trim()}
          onPress={async () => { await saveStep({ ...(existing ?? {}), id: existing?.id, text: text.trim(), rating, ladder: ladderId }); router.back(); }} />
        {existing ? (confirm
          ? <Btn kind="danger" title="Yes, delete" onPress={async () => { await removeStep(existing.id); router.back(); }} />
          : <Btn kind="ghost" title="Delete step" onPress={() => setConfirm(true)} />) : null}
      </Row>
    </Page>
  );
}
