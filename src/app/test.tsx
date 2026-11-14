/* GAD-7 and Mini-IPIP self-checks. Self-monitoring, not a diagnosis. */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { TRAITS, scoreTest, testDef, traitLevel } from '../core/cbt';
import { useStore } from '../data/store';
import { Btn, Comic, P, Page, Panel, Sticker } from '../ui/kit';
import { C, F } from '../ui/theme';

export default function TestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const def = testDef(id ?? 'gad7') ?? testDef('gad7')!;
  const { addTest } = useStore();
  const [answers, setAnswers] = useState<(number | null)[]>(() => def.items.map(() => null));
  const [extra, setExtra] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const result = scoreTest(def.id, answers);

  if (saved && result) {
    return (
      <Page>
        <Panel sticker="Saved" stickerBg={C.calm}>
          {'score' in result ? (
            <>
              <P bold>{result.score} of 21: {result.band}.</P>
              {result.score >= 10 ? <P>A score of 10 or more can be worth talking about with a doctor.</P> : null}
            </>
          ) : (
            TRAITS.map(([k, name]) => <P key={k}>{name}: {result.traits[k]} of 20 ({traitLevel(result.traits[k])})</P>)
          )}
          <P muted>This is for self-monitoring, not a diagnosis.</P>
          <Btn kind="primary" title="Close" onPress={() => router.back()} />
        </Panel>
      </Page>
    );
  }

  return (
    <Page>
      <Sticker bg={C.pink}>Self-monitoring, not a diagnosis</Sticker>
      <P bold>{def.name}</P>
      <P>{def.intro}</P>
      {def.items.map((it, i) => (
        <Comic key={i} bg={C.panel2} shadow={3} inner={{ gap: 8, padding: 14 }}>
          <P bold>{i + 1}. {it[0]}</P>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {def.options.map(([label, value]) => {
              const on = answers[i] === value;
              return (
                <Pressable key={label} accessibilityRole="radio" accessibilityState={{ checked: on }}
                  onPress={() => setAnswers(answers.map((a, k) => (k === i ? value : a)))}
                  style={{ borderColor: C.ink, borderWidth: 2, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: on ? C.sky : C.paper }}>
                  <Text style={{ fontFamily: F.bodySemi, fontSize: 13, color: C.ink }}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Comic>
      ))}
      {def.extra ? (
        <Comic bg={C.paper} shadow={3} inner={{ gap: 8, padding: 14 }}>
          <P bold>{def.extra.q}</P>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {def.extra.options.map((label, k) => (
              <Pressable key={label} onPress={() => setExtra(k)} accessibilityRole="radio" accessibilityState={{ checked: extra === k }}
                style={{ borderColor: C.ink, borderWidth: 2, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: extra === k ? C.sky : C.paper }}>
                <Text style={{ fontFamily: F.bodySemi, fontSize: 13, color: C.ink }}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </Comic>
      ) : null}
      <Btn kind="primary" title="Save" disabled={!result} onPress={async () => {
        if (!result) return;
        await addTest({ test: def.id, answers: answers as number[], ...('score' in result ? { score: result.score, band: result.band } : { traits: result.traits }),
          ...(extra !== null ? { impact: extra } : {}) });
        setSaved(true);
      }} />
    </Page>
  );
}
