import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { COUNTRIES, dayKey, isJournal, needsPart2, taskDone, todayTask, timeOf } from '../../core/cbt';
import { useStore } from '../../data/store';
import { fmtWhen, taskCopy } from '../../ui/copy';
import { Badge, Btn, Bullets, Comic, Hand, P, Page, Panel, Row, Sticker } from '../../ui/kit';
import { QuoteCard } from '../../ui/QuoteCard';
import { useNow } from '../../ui/useNow';
import { C, F } from '../../ui/theme';

function Intro() {
  const { settings, setSettings } = useStore();
  return (
    <Panel sticker="Before you start" stickerBg={C.berry}>
      <Bullets items={[
        '**Self-help, not treatment.** This app helps you practise CBT skills for anxiety. It is not therapy and does not diagnose. It does not replace a doctor or therapist.',
        '**Not for emergencies.** If you are in danger or think about hurting yourself, call your emergency number or a crisis line. The Quick help button lists them.',
        '**Private.** Your entries stay on this phone, in an encrypted database. No account, no server, no tracking.',
      ]} />
      <P bold>Your country, for the help numbers</P>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {COUNTRIES.map((c) => (
          <Pressable key={c.code} onPress={() => setSettings({ country: c.code })} accessibilityRole="radio" accessibilityState={{ checked: settings.country === c.code }}
            style={{ borderColor: C.ink, borderWidth: 2, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: settings.country === c.code ? C.sky : C.paper }}>
            <Text style={{ fontFamily: F.bodySemi, fontSize: 13, color: C.ink }}>{c.name}</Text>
          </Pressable>
        ))}
      </View>
      <Row>
        <Btn kind="primary" title="Got it" onPress={() => setSettings({ introSeen: true })} />
        <Btn kind="ghost" title="How to use" onPress={() => router.push('/guide')} />
      </Row>
    </Panel>
  );
}

function Today() {
  const { data, settings, setSettings } = useStore();
  const [why, setWhy] = useState(false);
  const [patternOk, setPatternOk] = useState(false);
  const now = useNow();
  const task = todayTask(data, now);
  const c = taskCopy(task, data);
  const done = taskDone(task, data, now) || (task.kind === 'pattern' && patternOk);
  if (settings.taskHiddenDay === dayKey(now)) return null;
  if (task.kind === 'rest' || done) {
    return (
      <Comic bg={C.panel2}>
        <Sticker bg={C.calm}>Today</Sticker>
        <View style={{ height: 8 }} />
        <P>{done && task.kind !== 'rest' ? 'Done for today. Well done.' : c.text}</P>
      </Comic>
    );
  }
  return (
    <Comic inner={{ gap: 10 }}>
      <Sticker bg={C.sky}>Today</Sticker>
      <Text style={{ fontFamily: F.display, fontSize: 20, color: C.ink }}>{c.title}</Text>
      <P>{c.text}</P>
      <Row>
        {c.go ? <Btn kind="primary" title={c.go} onPress={() => (c.href ? router.push(c.href as any) : setPatternOk(true))} /> : null}
        <Btn kind="ghost" title="Not today" onPress={() => setSettings({ taskHiddenDay: dayKey(now) })} />
      </Row>
      {c.why ? <Btn kind="ghost" small title={why ? 'Hide why' : 'Why this works'} onPress={() => setWhy(!why)} /> : null}
      {why ? <P muted>{c.why}</P> : null}
    </Comic>
  );
}

export default function Thoughts() {
  const { data, settings } = useStore();
  const records = data.records.slice().sort((a, b) => timeOf(b) - timeOf(a));
  return (
    <Page>
      {settings.introSeen ? null : <Intro />}
      <QuoteCard />
      <Today />
      <Row>
        <Btn kind="primary" title="+ Thought record" onPress={() => router.push('/record')} />
        <Btn title="+ Journal" onPress={() => router.push('/journal')} />
      </Row>
      <P muted>Tip: to dictate, tap the microphone on your keyboard.</P>
      <Text style={{ fontFamily: F.display, fontSize: 16, color: C.ink }}>{records.length} {records.length === 1 ? 'entry' : 'entries'}</Text>
      {records.length === 0 ? (
        <Comic bg={C.paper}><P>No entries yet. Tap + Thought record when you feel anxious, or + Journal when you just want to write.</P></Comic>
      ) : null}
      {records.map((r) => (
        <Pressable key={r.id} onPress={() => router.push(`/entry/${r.id}`)} accessibilityRole="button"
          accessibilityLabel={(isJournal(r) ? 'Journal entry ' : 'Thought record ') + fmtWhen(r.when || r.createdAt)}>
          <Comic bg={isJournal(r) ? C.paper : C.panel2} shadow={3} inner={{ gap: 8, padding: 14 }}>
            <Row>
              <Badge v={r.anxietyBefore} />
              {typeof r.anxietyAfter === 'number' ? (<><Text style={{ fontFamily: F.bodyBold, color: C.ink }}>→</Text><Badge v={r.anxietyAfter} /></>) : null}
              <Text style={{ fontFamily: F.bodySemi, fontSize: 13, color: C.inkSoft, flex: 1 }}>{fmtWhen(r.when || r.createdAt)}</Text>
              {isJournal(r) ? <Sticker tiny bg={C.calm}>Journal</Sticker> : needsPart2(r) ? <Sticker tiny bg={C.mid}>Part 2 open</Sticker> : null}
            </Row>
            <Hand size={18}>{((isJournal(r) ? r.text : r.thought || r.situation) || '').slice(0, 160) || '(empty)'}</Hand>
          </Comic>
        </Pressable>
      ))}
    </Page>
  );
}
