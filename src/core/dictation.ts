/* Voice input for text fields: pure logic, no React Native, so Jest tests it.
   Privacy rule: speech is turned into text ON THE PHONE only. If the phone cannot do that, voice input
   stays off and the person is told why. It never falls back to a cloud service. */

/* Options for ExpoSpeechRecognitionModule.start(). */
export function speechOptions(lang: string, servicePackage?: string) {
  return {
    lang,
    interimResults: true,
    continuous: true,
    addsPunctuation: true,
    requiresOnDeviceRecognition: true,
    ...(servicePackage ? { androidRecognitionServicePackage: servicePackage } : {}),
  };
}

/* The Android service that does on-device recognition (Speech Services by Google). */
export const ON_DEVICE_SERVICE = 'com.google.android.as';

/* Add spoken words to what is already in the field: one space between, a capital letter at the start
   of the field or after a full stop, question mark, exclamation mark or new line. */
export function appendTranscript(base: string, spoken: string): string {
  const said = spoken.replace(/\s+/g, ' ').trim();
  if (!said) return base;
  const before = base.replace(/[ \t]+$/, '');
  const startOfSentence = !before.trim() || /[.!?]$|\n$/.test(before);
  const words = startOfSentence ? said[0].toLocaleUpperCase() + said.slice(1) : said;
  if (!before) return words;
  return before + (/\n$/.test(before) ? '' : ' ') + words;
}

/* While listening: `committed` is the field text with all final parts added, `live` is what to show now. */
export interface DictationState { committed: string; live: string }
export const startDictation = (fieldText: string): DictationState => ({ committed: fieldText, live: fieldText });

/* One result event: the text of the best guess for the current part, and whether that part is final. */
export function onDictationResult(s: DictationState, transcript: string, isFinal: boolean): DictationState {
  if (isFinal) {
    const committed = appendTranscript(s.committed, transcript);
    return { committed, live: committed };
  }
  return { committed: s.committed, live: appendTranscript(s.committed, transcript) };
}

/* Pick the language: the phone's language if its offline model is installed, else another installed
   variant of the same language (en-GB for en-US), else English if installed, else the first installed one.
   `installed` empty means the phone did not say (Android 12 and older): then use the phone's language. */
export function pickSpeechLocale(deviceLocale: string, installed: string[]): string {
  const want = normLocale(deviceLocale || 'en-US');
  if (!installed.length) return want;
  const norm = installed.map(normLocale);
  const lang = want.split('-')[0];
  return norm.find((l) => l === want)
    ?? norm.find((l) => l.split('-')[0] === lang)
    ?? norm.find((l) => l.startsWith('en'))
    ?? norm[0];
}
function normLocale(l: string) {
  const [a, b] = l.replace('_', '-').split('-');
  return b ? a.toLowerCase() + '-' + b.toUpperCase() : a.toLowerCase();
}

export type DictationProblem =
  | 'no-on-device' | 'no-model' | 'downloading' | 'not-allowed' | 'no-speech' | 'busy' | 'audio' | 'other';

/* Can voice input start? Checked before every start, so nothing ever goes to a network service. */
export function checkOnDevice(info: { supportsOnDevice: boolean; available: boolean }): DictationProblem | null {
  if (!info.supportsOnDevice) return 'no-on-device';
  if (!info.available) return 'no-on-device';
  return null;
}

/* Map an error code from the speech module to a problem the person can act on. */
export function problemFromError(code: string): DictationProblem | null {
  switch (code) {
    case 'aborted': return null;
    case 'no-speech':
    case 'speech-timeout': return 'no-speech';
    case 'not-allowed': return 'not-allowed';
    case 'language-not-supported': return 'no-model';
    case 'service-not-allowed':
    // On-device recognition never needs the network. A network error means the phone tried to go online: stop.
    case 'network': return 'no-on-device';
    case 'busy': return 'busy';
    case 'audio-capture':
    case 'interrupted': return 'audio';
    default: return 'other';
  }
}

export const DICTATION_MESSAGES: Record<DictationProblem, string> = {
  'no-on-device': 'Voice input works only when your phone can turn speech into text by itself, so nothing you say leaves the phone. This phone cannot do that. You can still use the microphone on your keyboard.',
  'no-model': 'Your phone needs the offline speech pack for this language first. Tap Download, then try again.',
  downloading: 'The speech pack is downloading. It may wait for Wi-Fi. Try again in a few minutes.',
  'not-allowed': 'The app may not use the microphone. Allow it in your phone settings, under Apps, CBT Practice Log, Permissions.',
  'no-speech': 'I did not hear anything. Tap the microphone and try again.',
  busy: 'Voice input is busy. Wait a moment and try again.',
  audio: 'The microphone stopped (for example a call came in). Tap it to start again.',
  other: 'Voice input stopped. Tap the microphone to try again.',
};
