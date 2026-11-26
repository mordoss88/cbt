/* AI coach (Claude). Off until the person turns it on here, after reading what is sent.
   The chat and the coach's notes stay in the encrypted database on the phone. Each message goes with the person's
   data to our coach proxy, which passes it to Claude and keeps nothing (supabase/functions/coach). */
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { helplineText, todayTask } from '../core/cbt';
import {
  CHAT_SUGGESTIONS, COACH_LABEL, COACH_MESSAGES, MAX_USER_MSG, coachDataContext, fmtWhen, runCoachTurn, trunc, type CoachProblem,
} from '../core/coach';
import type { AppData, ChatMessage } from '../core/types';
import { useBackup } from '../data/backup';
import { cloud } from '../data/cloud';
import { sendToCoach } from '../data/coachClient';
import { newId, useStore } from '../data/store';
import { taskCopy } from '../ui/copy';
import { Btn, Bullets, Comic, Field, P, Page, Panel, Rich, Row } from '../ui/kit';
import { C, F } from '../ui/theme';

/* What goes with each request: the person's data, the help numbers and the time. */
function coachInputs(d: AppData, country: string | null) {
  const now = Date.now();
  return {
    context: coachDataContext(d, now, { today: taskCopy(todayTask(d, now), d).title }),
    helplines: helplineText(country ?? 'OTHER'),
    now: new Date(now).toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    toolNow: new Date(now).toISOString(),
  };
}

function OptIn({ onYes }: { onYes: () => void }) {
  return (
    <Page>
      <Panel title={COACH_LABEL} sticker="Optional" stickerBg={C.calm}>
        <P>The coach is an AI (Claude, made by Anthropic). It is not a person and not a therapist. It helps you use CBT with your own entries.</P>
        <Bullets items={[
          '**What is sent:** each time you send a message, the app sends it with your entries, ladders, check-ins, self-check results, the coach\'s notes and the last part of the chat.',
          '**Where it goes:** to the app\'s coach service, which passes it to Anthropic to write the answer. The coach service keeps nothing. Anthropic\'s privacy rules for its API apply.',
          '**What stays on the phone:** the chat and the coach\'s notes, in the encrypted database. Nobody else can read them.',
          'Nothing is sent until you turn the coach on, and only when you send a message. You can turn it off at any time.',
          '**Not for emergencies.** If you are in danger, open Quick help.',
        ]} />
        <Btn kind="primary" title="Turn on the coach" onPress={onYes} />
        <Btn kind="ghost" title="Not now" onPress={() => router.back()} />
      </Panel>
    </Page>
  );
}

function Bubble({ m, live }: { m: ChatMessage; live?: boolean }) {
  const mine = m.role === 'user';
  return (
    <View style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '92%', gap: 4 }}>
      <Comic bg={mine ? C.sky : C.paper} shadow={3} inner={{ gap: 6 }}>
        {m.text ? <Rich text={m.text} /> : <ActivityIndicator color={C.ink} />}
        {(m.actions || []).map((a, i) => (
          <Text key={i} style={{ fontFamily: F.bodySemi, fontSize: 13, color: C.ink }}>{a.type === 'memory' ? '📝 Saved a note: ' : '🪜 Added a ladder step: '}{a.text}</Text>
        ))}
      </Comic>
      <Text style={{ fontFamily: F.body, fontSize: 12, color: C.ink, alignSelf: mine ? 'flex-end' : 'flex-start' }}>
        {mine ? 'You' : 'AI coach'}{m.createdAt ? ' · ' + fmtWhen(m.createdAt).split(', ')[1] : ''}{m.recId ? ' · Whole entry sent' : ''}
        {live ? ' · writing…' : m.flag === 'cut' ? ' · stopped early' : m.flag === 'stopped' ? ' · stopped' : ''}
      </Text>
    </View>
  );
}

export default function CoachScreen() {
  const { rec } = useLocalSearchParams<{ rec?: string }>();
  const db = useSQLiteContext();
  const { data, settings, setSettings, updateData } = useStore();
  const backup = useBackup();
  // "Talk it through with the coach" from an entry: a ready message, the whole entry goes with it.
  const [start] = useState(() => {
    const r = rec ? data.records.find((x) => x.id === rec) : undefined;
    return r ? { recId: r.id, text: 'Help me talk through my entry from ' + fmtWhen(r.when || r.createdAt) + (r.situation ? ': "' + trunc(r.situation, 80) + '"' : '') + '.' } : { recId: undefined, text: '' };
  });
  const [text, setText] = useState(start.text);
  const [recId, setRecId] = useState<string | undefined>(start.recId);
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState('');
  const [problem, setProblem] = useState<CoachProblem | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const ctl = useRef<AbortController | null>(null);

  if (!settings.coachOn) return <OptIn onYes={() => setSettings({ coachOn: new Date().toISOString() })} />;

  const signedIn = backup.phase === 'ready' || backup.phase === 'need-passphrase';
  const chat = [...data.chat].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));

  const ask = async () => {
    const c = cloud(db);
    if (!c) { setProblem('signed-out'); return; }
    setBusy(true); setLive(''); setProblem(null);
    const ac = new AbortController();
    ctl.current = ac;
    const d = await updateData((x) => x);
    const inp = coachInputs(d, settings.country);
    const r = await runCoachTurn({
      data: d, context: inp.context, helplines: inp.helplines, now: inp.now,
      send: (body, onText) => sendToCoach(c, body, onText, ac.signal),
      onText: setLive,
      tool: { now: inp.toolNow, newId },
    });
    const stopped = ac.signal.aborted;
    ctl.current = null;
    await updateData((x) => {
      // Tool changes (notes, ladder steps) come from r.data; the chat may have changed meanwhile, so keep the newest chat.
      const base = { ...r.data, chat: x.chat };
      if (!r.text.trim() && !r.actions.length) return base;
      const m: ChatMessage = { id: newId(), role: 'assistant', text: r.text.trim() || 'Done.', createdAt: new Date().toISOString(),
        ...(r.actions.length ? { actions: r.actions } : {}), ...(stopped ? { flag: 'stopped' as const } : r.flag ? { flag: r.flag } : {}) };
      return { ...base, chat: [...x.chat, m] };
    });
    if (r.problem && !stopped) setProblem(r.problem);
    setBusy(false); setLive('');
  };

  const send = async (t: string) => {
    const msg = t.trim().slice(0, MAX_USER_MSG);
    if (!msg || busy) return;
    const m: ChatMessage = { id: newId(), role: 'user', text: msg, createdAt: new Date().toISOString(), ...(recId ? { recId } : {}) };
    setText(''); setRecId(undefined);
    await updateData((x) => ({ ...x, chat: [...x.chat, m] }));
    await ask();
  };

  const lastIsMine = chat.length > 0 && chat[chat.length - 1].role === 'user';
  const nSteps = data.ladder.length;

  return (
    <Page>
      <Comic bg={C.panel2}>
        <P><Text style={{ fontFamily: F.bodyBold }}>{COACH_LABEL}.</Text> Not a person and not a therapist. For emergencies, use Quick help.</P>
      </Comic>

      {!signedIn ? (
        <Panel title="Sign in first" bg={C.pink}>
          <P>{COACH_MESSAGES['signed-out']}</P>
          <Btn kind="primary" title="Cloud backup and sign-in" onPress={() => router.push('/backup')} />
        </Panel>
      ) : null}

      <Panel>
        <Pressable onPress={() => setNotesOpen(!notesOpen)} accessibilityRole="button" accessibilityState={{ expanded: notesOpen }}>
          <P bold>Your coach sees {data.records.length} {data.records.length === 1 ? 'entry' : 'entries'}, {nSteps} {nSteps === 1 ? 'step' : 'steps'}, {data.notes.length} {data.notes.length === 1 ? 'note' : 'notes'} {notesOpen ? '−' : '+'}</P>
        </Pressable>
        {notesOpen ? (
          <View style={{ gap: 8 }}>
            <P muted>Notes are short things your coach saved about you. Tap Forget to remove one.</P>
            {data.notes.length ? data.notes.map((n) => (
              <Row key={n.id} wrap={false}>
                <View style={{ flex: 1 }}><P>{n.text}</P></View>
                <Btn small kind="ghost" title="Forget" onPress={() => updateData((x) => ({ ...x, notes: x.notes.filter((y) => y.id !== n.id) }))} />
              </Row>
            )) : <P muted>Nothing yet. When you tell your coach something important, it saves a short note here.</P>}
          </View>
        ) : null}
      </Panel>

      <View style={{ gap: 14 }}>
        {!chat.length ? <Bubble m={{ role: 'assistant', text: 'Hi! I am your AI coach, powered by Claude. I can see your entries, your fear ladders and my notes about you. Tell me what is on your mind, or pick a question below.' }} /> : null}
        {chat.slice(-60).map((m, i) => <Bubble key={m.id ?? i} m={m} />)}
        {busy ? <Bubble m={{ role: 'assistant', text: live }} live /> : null}
      </View>

      {problem ? (
        <Comic bg={C.pink} inner={{ gap: 8 }}>
          <P bold>{COACH_MESSAGES[problem]}</P>
          {lastIsMine && problem !== 'not-enabled' && problem !== 'not-allowed' ? <Btn small title="Try again" onPress={ask} /> : null}
          {problem === 'signed-out' ? <Btn small title="Sign in" onPress={() => router.push('/backup')} /> : null}
        </Comic>
      ) : null}

      {!chat.length && !busy ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CHAT_SUGGESTIONS.map((s) => (
            <Pressable key={s} onPress={() => send(s)} disabled={!signedIn} accessibilityRole="button"
              style={{ borderColor: C.ink, borderWidth: 2, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: C.paper, opacity: signedIn ? 1 : 0.5 }}>
              <Text style={{ fontFamily: F.bodySemi, fontSize: 14, color: C.ink }}>{s}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Field label="Message to your coach" value={text} onChangeText={setText} placeholder="Write or speak to your coach…" />
      {recId ? <P muted>The coach gets your whole entry with this message.</P> : null}
      <Row>
        {busy
          ? <Btn title="Stop" onPress={() => ctl.current?.abort()} />
          : <Btn kind="primary" title="Send" disabled={!signedIn || !text.trim()} onPress={() => send(text)} />}
        {lastIsMine && !busy && !problem ? <Btn title="Get an answer" disabled={!signedIn} onPress={ask} /> : null}
      </Row>

      <Panel title="Chat settings">
        {confirmClear ? (
          <View style={{ gap: 8 }}>
            <P bold>Delete the whole chat from this phone? The coach&apos;s notes stay.</P>
            <Row>
              <Btn kind="danger" title="Yes, clear the chat" onPress={async () => { await updateData((x) => ({ ...x, chat: [] })); setConfirmClear(false); }} />
              <Btn kind="ghost" title="Cancel" onPress={() => setConfirmClear(false)} />
            </Row>
          </View>
        ) : <Btn kind="ghost" title="Clear chat" onPress={() => setConfirmClear(true)} />}
        <Btn kind="ghost" title="Turn the coach off" onPress={() => { ctl.current?.abort(); setSettings({ coachOn: null }); router.back(); }} />
      </Panel>
    </Page>
  );
}
