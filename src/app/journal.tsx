/* Free-text journal entry. It never needs Part 2. */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import type { ThoughtRecord } from '../core/types';
import { useStore } from '../data/store';
import { Btn, Field, P, Page, Panel, Rating, Row } from '../ui/kit';

export default function JournalScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data, saveRecord } = useStore();
  const existing = id ? data.records.find((r) => r.id === id) : undefined;
  const [r, setR] = useState<ThoughtRecord>(() => existing ?? { id: '', kind: 'journal', when: new Date().toISOString(), text: '' });
  const [withAnxiety, setWithAnxiety] = useState(typeof existing?.anxietyBefore === 'number');
  return (
    <Page>
      <Panel>
        <Field label="Write whatever is on your mind" value={r.text} onChangeText={(t) => setR({ ...r, text: t })} style={{ minHeight: 220 }} />
        {withAnxiety ? (
          <Rating label="How anxious are you? (0-100)" value={r.anxietyBefore} onChange={(v) => setR({ ...r, anxietyBefore: v })} />
        ) : (
          <Btn small kind="ghost" title="Add an anxiety rating" onPress={() => setWithAnxiety(true)} />
        )}
      </Panel>
      <Row>
        <Btn kind="primary" title="Save" disabled={!r.text?.trim()} onPress={async () => { await saveRecord(r); router.back(); }} />
      </Row>
      <P muted>Tip: to dictate, tap the microphone on your keyboard.</P>
    </Page>
  );
}
