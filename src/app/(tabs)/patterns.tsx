import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { TRAITS, anxietyLevel, stats, testDue, testHistory, timeOf, traitLevel, trapName, weekSummary } from '../../core/cbt';
import { useStore } from '../../data/store';
import { fmtDay } from '../../ui/copy';
import { Btn, P, Page, Panel, Row } from '../../ui/kit';
import { C, F, levelColor } from '../../ui/theme';
import { useNow } from '../../ui/useNow';

function Bars({ items }: { items: [string, number][] }) {
  if (!items.length) return <P muted>Nothing yet.</P>;
  const max = items[0][1];
  return (
    <View style={{ gap: 6 }}>
      {items.slice(0, 5).map(([k, n]) => (
        <View key={k} style={{ gap: 2 }}>
          <Text style={{ fontFamily: F.bodySemi, fontSize: 14, color: C.ink }}>{k} · {n}</Text>
          <View style={{ height: 12, borderRadius: 6, borderWidth: 2, borderColor: C.ink, backgroundColor: C.paper, overflow: 'hidden' }}>
            <View style={{ width: `${(n / max) * 100}%`, height: '100%', backgroundColor: C.sky }} />
          </View>
        </View>
      ))}
    </View>
  );
}

/* Anxiety per entry, oldest left. Each bar is the anxiety in the moment, with a dark line at the rating after Part 2. */
function Chart({ points }: { points: { before: number; after: number | null }[] }) {
  if (points.length < 2) return <P muted>The chart starts after two entries with an anxiety rating.</P>;
  return (
    <View accessible accessibilityLabel={`Anxiety in your last ${points.length} entries`} style={{ height: 130, flexDirection: 'row', alignItems: 'flex-end', gap: 3,
      borderBottomWidth: 2.5, borderColor: C.ink, paddingBottom: 2 }}>
      {points.map((p, i) => (
        <View key={i} style={{ flex: 1, height: `${Math.max(4, p.before)}%`, backgroundColor: levelColor(anxietyLevel(p.before)), borderColor: C.ink, borderWidth: 1.5, borderRadius: 4 }}>
          {p.after !== null ? <View style={{ position: 'absolute', left: -1, right: -1, bottom: `${(p.after / Math.max(1, p.before)) * 100}%`, height: 3, backgroundColor: C.ink }} /> : null}
        </View>
      ))}
    </View>
  );
}

export default function PatternsTab() {
  const { data } = useStore();
  const now = useNow();
  const w = weekSummary(data, now);
  const st = stats(data.records, now);
  const points = data.records.filter((r) => typeof r.anxietyBefore === 'number').sort((a, b) => timeOf(a) - timeOf(b)).slice(-30)
    .map((r) => ({ before: r.anxietyBefore as number, after: typeof r.anxietyAfter === 'number' ? r.anxietyAfter : null }));
  const gad = testHistory(data.tests, 'gad7');
  const ipip = testHistory(data.tests, 'ipip');
  const lastGad = gad[gad.length - 1];
  const lastIpip = ipip[ipip.length - 1];
  return (
    <Page>
      <Panel title="This week" sticker="Last 7 days" stickerBg={C.sky}>
        <Row gap={6}>
          {w.days.map((d) => (
            <View key={d.day} accessibilityLabel={`${d.day}: ${d.on ? 'practised' : 'no practice'}`}
              style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 2.5, borderColor: C.ink, backgroundColor: d.on ? C.calm : C.paper, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: F.display, fontSize: 12, color: C.ink }}>{new Date(d.day + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'narrow' })}</Text>
            </View>
          ))}
        </Row>
        <P>{w.practiceDays} of 7 days practised (goal: {w.goal}). {w.tries} ladder {w.tries === 1 ? 'try' : 'tries'}.</P>
        {w.avg !== null ? <P>Average anxiety {w.avg}{w.avgPrev !== null ? ` (the week before: ${w.avgPrev})` : ''}.</P> : null}
        {w.checkins.length ? <P muted>Check-ins (anxiety 0-10): {w.checkins.map((c) => c.anxiety ?? '–').join(' → ')}</P> : null}
        <Btn small title="Weekly check-in" onPress={() => router.push('/checkin')} />
      </Panel>

      <Panel title="Self-checks" sticker="Self-monitoring, not a diagnosis" stickerBg={C.pink}>
        <P>Anxiety (GAD-7): {lastGad ? `${lastGad.score} of 21, ${lastGad.band}, on ${fmtDay(Date.parse(lastGad.at))}` : 'not taken yet'}.</P>
        {gad.length > 1 ? <P muted>History: {gad.slice(-6).map((g) => g.score).join(' → ')}</P> : null}
        {lastGad && typeof lastGad.score === 'number' && lastGad.score >= 10 ? (
          <P bold>A score of 10 or more can be worth talking about with a doctor. This is not a diagnosis.</P>
        ) : null}
        <Row>
          <Btn small kind={testDue(data.tests, 'gad7', now) ? 'primary' : 'plain'} title="Anxiety self-check" onPress={() => router.push('/test?id=gad7')} />
          <Btn small title="Personality" onPress={() => router.push('/test?id=ipip')} />
        </Row>
        {lastIpip?.traits ? (
          <P muted>{TRAITS.map(([k, name]) => `${name}: ${traitLevel(lastIpip.traits![k])}`).join(' · ')}</P>
        ) : null}
      </Panel>

      <Panel title="What stands out">
        <P>{st.count} entries. {st.avg !== null ? `Average anxiety ${st.avg}.` : ''} {st.drop !== null ? `Part 2 lowers it by ${st.drop} on average.` : ''}</P>
        <Chart points={points} />
      </Panel>
      <Panel title="Thinking traps"><Bars items={st.traps.map(([k, n]) => [trapName(k), n])} /></Panel>
      <Panel title="Safety behaviors"><Bars items={st.safety} /></Panel>
      <Panel title="Body signs"><Bars items={st.body} /></Panel>
    </Page>
  );
}
