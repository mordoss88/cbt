/* Voice input for a text field. Speech becomes text on the phone only (requiresOnDeviceRecognition).
   If the phone cannot do that, it says so and stays off: it never sends audio to a cloud service.
   Only one field listens at a time. */
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useEffect, useId, useRef, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import {
  DICTATION_MESSAGES, ON_DEVICE_SERVICE, checkOnDevice, onDictationResult, pickSpeechLocale, problemFromError, speechOptions,
  startDictation, type DictationProblem, type DictationState,
} from '../core/dictation';
import { C, F } from './theme';

let owner: string | null = null;

async function prepare(): Promise<{ lang: string } | { problem: DictationProblem }> {
  const M = ExpoSpeechRecognitionModule;
  const problem = checkOnDevice({ supportsOnDevice: M.supportsOnDeviceRecognition(), available: M.isRecognitionAvailable() });
  if (problem) return { problem };
  const perm = await M.requestPermissionsAsync();
  if (!perm.granted) return { problem: 'not-allowed' };
  let installed: string[] = [];
  try {
    const pkg = Platform.OS === 'android' && M.getSpeechRecognitionServices().includes(ON_DEVICE_SERVICE) ? ON_DEVICE_SERVICE : undefined;
    installed = (await M.getSupportedLocales({ androidRecognitionServicePackage: pkg })).installedLocales;
  } catch { /* older Android: the phone does not list them */ }
  return { lang: pickSpeechLocale(Intl.DateTimeFormat().resolvedOptions().locale, installed) };
}

export function MicButton({ value, onChange, label }: { value: string; onChange: (t: string) => void; label: string }) {
  const id = useId();
  const [on, setOn] = useState(false);
  const [problem, setProblem] = useState<{ p: DictationProblem; lang?: string } | null>(null);
  const st = useRef<DictationState | null>(null);
  const lang = useRef('en-US');

  useSpeechRecognitionEvent('result', (e) => {
    if (owner !== id || !st.current) return;
    st.current = onDictationResult(st.current, e.results[0]?.transcript ?? '', e.isFinal);
    onChange(st.current.live);
  });
  useSpeechRecognitionEvent('error', (e) => {
    if (owner !== id) return;
    const p = problemFromError(e.error);
    if (p) setProblem({ p, lang: lang.current });
    if (p === 'no-on-device') ExpoSpeechRecognitionModule.abort();
  });
  useSpeechRecognitionEvent('end', () => {
    if (owner !== id) return;
    owner = null;
    st.current = null;
    setOn(false);
  });
  // Stop listening when the field goes away (for example the entry is saved).
  useEffect(() => () => { if (owner === id) { owner = null; ExpoSpeechRecognitionModule.abort(); } }, [id]);

  const toggle = async () => {
    setProblem(null);
    if (on) { ExpoSpeechRecognitionModule.stop(); return; }
    if (owner) ExpoSpeechRecognitionModule.abort();
    const r = await prepare();
    if ('problem' in r) { setProblem({ p: r.problem }); return; }
    lang.current = r.lang;
    owner = id;
    st.current = startDictation(value);
    setOn(true);
    ExpoSpeechRecognitionModule.start(speechOptions(r.lang));
  };

  const download = async () => {
    try {
      const res = await ExpoSpeechRecognitionModule.androidTriggerOfflineModelDownload({ locale: problem?.lang ?? lang.current });
      setProblem(res.status === 'download_success' ? null : { p: 'downloading' });
    } catch { /* the message stays */ }
  };

  return (
    <View style={{ gap: 4 }}>
      <Pressable onPress={toggle} accessibilityRole="button" accessibilityState={{ selected: on }}
        accessibilityLabel={on ? `Stop voice input for ${label}` : `Speak into ${label}`}
        style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5,
          borderRadius: 999, borderWidth: 2, borderColor: C.ink, backgroundColor: on ? C.berry : C.paper }}>
        <Text style={{ fontSize: 15 }}>{on ? '■' : '🎤'}</Text>
        <Text style={{ fontFamily: F.bodySemi, fontSize: 14, color: C.ink }}>{on ? 'Listening… tap to stop' : 'Speak'}</Text>
      </Pressable>
      {problem ? (
        <View style={{ gap: 6, backgroundColor: C.pink, borderRadius: 10, padding: 8 }}>
          <Text style={{ fontFamily: F.bodySemi, fontSize: 13, color: C.ink }}>
            {DICTATION_MESSAGES[problem.p]}
          </Text>
          {problem.p === 'no-model' && Platform.OS === 'android' ? (
            <Pressable onPress={download} accessibilityRole="button"
              style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, borderWidth: 2, borderColor: C.ink, backgroundColor: C.paper }}>
              <Text style={{ fontFamily: F.bodySemi, fontSize: 14, color: C.ink }}>Download</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
