/* Quick help, for panic. Breathing starts by itself (in 4, out 6). Same content as the tracker's panel, plus
   "Are you alone?": out-loud and body techniques when alone, silent ones with other people (core/quickHelp.ts).
   The medical signs and the numbers always show. */
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, Linking, Pressable, Text, View } from 'react-native';
import { country } from '../core/cbt';
import { helpContent, type HelpContent, type HelpPlace } from '../core/quickHelp';
import { useStore } from '../data/store';
import { Btn, Bullets, Comic, P, Page, Panel, Row, ThoughtBubble } from '../ui/kit';
import { C, F } from '../ui/theme';

function Breathing({ h }: { h: HelpContent }) {
  const [running, setRunning] = useState(true);
  // One breath is 10 seconds: 4 in, 6 out.
  const [sec, setSec] = useState(0);
  const pos = sec % 10;
  const phase: 'in' | 'out' = pos < 4 ? 'in' : 'out';
  const count = phase === 'in' ? 4 - pos : 10 - pos;
  const breaths = Math.floor(sec / 10);
  const [scale] = useState(() => new Animated.Value(0.6));
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSec((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [running]);
  useEffect(() => {
    if (!running) return;
    Animated.timing(scale, { toValue: phase === 'in' ? 1 : 0.6, duration: phase === 'in' ? 4000 : 6000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }).start();
  }, [running, phase, scale]);
  return (
    <Comic bg={C.sky} inner={{ gap: 10, alignItems: 'center' }}>
      <Text style={{ fontFamily: F.display, fontSize: 19, color: C.ink, alignSelf: 'flex-start' }}>{h.breatheTitle}</Text>
      <P>{h.breathe}</P>
      <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }} accessibilityLiveRegion="polite"
        accessibilityLabel={running ? `Breathe ${phase}, ${count}` : 'Breathing paused'}>
        <Animated.View style={{ position: 'absolute', width: 190, height: 190, borderRadius: 95, borderWidth: 3, borderColor: C.ink,
          backgroundColor: phase === 'in' ? C.panel : C.calm, transform: [{ scale }] }} />
        <Text style={{ fontFamily: F.displayBold, fontSize: 22, color: C.ink }}>{running ? (phase === 'in' ? 'Breathe in' : 'Breathe out') : 'Paused'}</Text>
        <Text style={{ fontFamily: F.displayBold, fontSize: 40, color: C.ink }}>{running ? count : ''}</Text>
      </View>
      <P bold>{breaths} {breaths === 1 ? 'breath' : 'breaths'}</P>
      <Btn title={running ? 'Pause' : 'Start'} onPress={() => setRunning(!running)} style={{ alignSelf: 'center' }} />
    </Comic>
  );
}

const SENSES: [number, string][] = [[5, 'things you can see'], [4, 'things you can feel'], [3, 'things you can hear'], [2, 'things you can smell'], [1, 'thing you can taste']];

function Grounding({ hint }: { hint: string }) {
  const [taps, setTaps] = useState<number[]>([0, 0, 0, 0, 0]);
  return (
    <Panel title="3 · Ground yourself: 5-4-3-2-1">
      <P muted>{hint}</P>
      {SENSES.map(([n, label], i) => (
        <View key={label} style={{ gap: 4 }}>
          <P bold>{n} {label}</P>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {Array.from({ length: n }).map((_, k) => (
              <Pressable key={k} accessibilityRole="checkbox" accessibilityState={{ checked: taps[i] > k }} accessibilityLabel={`${label} ${k + 1}`}
                onPress={() => setTaps(taps.map((t, j) => (j === i ? (t > k ? k : k + 1) : t)))}
                style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 2.5, borderColor: C.ink, backgroundColor: taps[i] > k ? C.calm : C.paper }} />
            ))}
          </View>
        </View>
      ))}
      <Btn small title="Start again" onPress={() => setTaps([0, 0, 0, 0, 0])} />
    </Panel>
  );
}

function Numbers({ list }: { list: [string, string][] }) {
  return (
    <View style={{ gap: 8 }}>
      {list.map(([num, label]) => (
        <Btn key={num} kind="dark" title={`${label}: ${num}`} accessibilityLabel={`Call ${label}, ${num}`}
          onPress={() => Linking.openURL('tel:' + num.replace(/\s/g, '')).catch(() => {})} />
      ))}
    </View>
  );
}

function Place({ place, onPick }: { place: HelpPlace | null; onPick: (p: HelpPlace) => void }) {
  const chip = (p: HelpPlace, label: string) => (
    <Pressable key={p} onPress={() => onPick(p)} accessibilityRole="radio" accessibilityState={{ checked: place === p }}
      style={{ borderColor: C.ink, borderWidth: 2.5, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: place === p ? C.calm : C.paper }}>
      <Text style={{ fontFamily: F.bodySemi, fontSize: 15, color: C.ink }}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={{ gap: 6 }} accessibilityRole="radiogroup" accessibilityLabel="Are you alone right now?">
      <P bold>Are you alone right now?</P>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {chip('alone', 'Yes, alone')}
        {chip('others', 'With other people')}
      </View>
    </View>
  );
}

export default function QuickHelp() {
  const { settings, setSettings } = useStore();
  const c = country(settings.country);
  const place = settings.helpPlace ?? null;
  const h = helpContent(place);
  return (
    <Page help={false}>
      <View style={{ height: 40 }} />
      <Row>
        <Text accessibilityRole="header" style={{ fontFamily: F.displayBold, fontSize: 30, color: C.ink, flex: 1 }}>Quick help</Text>
        <Btn small title="Close" onPress={() => router.back()} />
      </Row>
      <P bold>Stay with this page. The wave will pass.</P>
      <Comic bg={C.paper}><P>This is anxiety. It feels awful, but it is not dangerous. It goes up, and then it comes down.</P></Comic>
      <Place place={place} onPick={(p) => setSettings({ helpPlace: p })} />
      <Breathing h={h} />
      <Panel title={h.waveTitle}>
        <Bullets items={h.wave} />
      </Panel>
      <Grounding hint={h.groundingHint} />
      <Panel title="4 · Answer the panic thought">
        <P muted>{h.answerHint}</P>
        {[
          ['I am having a heart attack.', 'A fast heart is a normal part of panic. It is your body\'s alarm, not damage.'],
          ['I cannot breathe.', 'You get enough air. Fast breathing makes the air feel short. Breathe out slowly.'],
          ['I will faint.', 'In panic, blood pressure goes up. Fainting needs it to go down, so it is very rare in panic.'],
          ['I am going crazy. I will lose control.', 'Panic feels strange, but it does not make you lose your mind or your control.'],
          ['Everyone can see it.', 'Most people cannot see what you feel inside.'],
        ].map(([t, a]) => (
          <View key={t} style={{ gap: 6 }}>
            <ThoughtBubble>{t}</ThoughtBubble>
            <P>{a}</P>
          </View>
        ))}
      </Panel>
      <Panel title="Get medical help if" bg={C.pink}>
        <Bullets items={[
          'the chest pain is new, or different from your usual anxiety',
          'the pain goes to your arm, jaw or back',
          'you faint, or you are not sure that it is panic',
        ]} />
        <P bold>Emergency numbers · {c.name}</P>
        {c.emergency.length ? <Numbers list={c.emergency} /> : <P>Call your local emergency number.</P>}
      </Panel>
      <Panel title="If you think about suicide or hurting yourself" bg={C.panel2}>
        <P>You do not have to handle this alone. Call now and talk to someone. If you are in danger right now, call the emergency number above.</P>
        {c.crisis.length ? <Numbers list={c.crisis.map(([n, l]) => [n, l.split('.')[0]] as [string, string])} /> : null}
        <Btn kind="ghost" title="Other countries: findahelpline.com" onPress={() => Linking.openURL('https://findahelpline.com').catch(() => {})} />
        <Btn kind="ghost" small title="Change your country" onPress={() => { router.back(); router.push('/about'); }} />
      </Panel>
      <Panel title="When it passes" bg={C.calm}>
        <P>You got through it. Write it down while you remember it. This helps you see your patterns.</P>
        <Row>
          <Btn kind="primary" title="Log this moment" onPress={() => { router.back(); router.push('/record'); }} />
          <Btn title="Close" onPress={() => router.back()} />
        </Row>
      </Panel>
    </Page>
  );
}
