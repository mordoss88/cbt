import {
  DICTATION_MESSAGES, appendTranscript, checkOnDevice, onDictationResult, pickSpeechLocale, problemFromError, speechOptions, startDictation,
  type DictationProblem,
} from '../src/core/dictation';

describe('voice input', () => {
  test('always asks for on-device recognition, with live text and punctuation', () => {
    expect(speechOptions('en-US')).toEqual({ lang: 'en-US', interimResults: true, continuous: true, addsPunctuation: true, requiresOnDeviceRecognition: true });
    expect(speechOptions('sr-RS', 'com.google.android.as').requiresOnDeviceRecognition).toBe(true);
  });

  test('never starts without on-device recognition (no silent cloud fallback)', () => {
    expect(checkOnDevice({ supportsOnDevice: false, available: true })).toBe('no-on-device');
    expect(checkOnDevice({ supportsOnDevice: true, available: false })).toBe('no-on-device');
    expect(checkOnDevice({ supportsOnDevice: true, available: true })).toBeNull();
    // A network error means the phone tried to go online: treat it as "no on-device".
    expect(problemFromError('network')).toBe('no-on-device');
  });

  test('adds spoken words with one space and a capital at the start of a sentence', () => {
    expect(appendTranscript('', 'my heart was racing')).toBe('My heart was racing');
    expect(appendTranscript('At the stand-up', 'my heart was racing')).toBe('At the stand-up my heart was racing');
    expect(appendTranscript('It went fine.', 'then i left')).toBe('It went fine. Then i left');
    expect(appendTranscript('First line\n', 'second')).toBe('First line\nSecond');
    expect(appendTranscript('Trailing   ', '  lots   of  space ')).toBe('Trailing lots of space');
    expect(appendTranscript('Keep me', '   ')).toBe('Keep me');
    expect(appendTranscript('', 'ćao svima')).toBe('Ćao svima');
  });

  test('live words show while speaking, and final parts are kept in order', () => {
    let s = startDictation('Situation:');
    s = onDictationResult(s, 'call with', false);
    expect(s.live).toBe('Situation: call with');
    expect(s.committed).toBe('Situation:');
    s = onDictationResult(s, 'call with the team.', true);
    expect(s.live).toBe('Situation: call with the team.');
    s = onDictationResult(s, 'i froze', false);
    expect(s.live).toBe('Situation: call with the team. I froze');
    s = onDictationResult(s, 'I froze.', true);
    expect(s.committed).toBe('Situation: call with the team. I froze.');
    // An empty final part changes nothing.
    expect(onDictationResult(s, '', true)).toEqual(s);
  });

  test('picks an installed language: exact, same language, English, then the first', () => {
    expect(pickSpeechLocale('sr-RS', ['en-US', 'sr-RS'])).toBe('sr-RS');
    expect(pickSpeechLocale('en_GB', ['de-DE', 'en-US'])).toBe('en-US');
    expect(pickSpeechLocale('sr-Latn-RS', ['de-DE', 'en-US'])).toBe('en-US');
    expect(pickSpeechLocale('sr-RS', ['de-DE'])).toBe('de-DE');
    expect(pickSpeechLocale('sr-RS', [])).toBe('sr-RS');
    expect(pickSpeechLocale('', [])).toBe('en-US');
  });

  test('every error has a plain message, and a stop by the person shows none', () => {
    expect(problemFromError('aborted')).toBeNull();
    expect(problemFromError('language-not-supported')).toBe('no-model');
    expect(problemFromError('not-allowed')).toBe('not-allowed');
    expect(problemFromError('something-new')).toBe('other');
    for (const code of ['no-speech', 'busy', 'audio-capture', 'interrupted', 'service-not-allowed', 'speech-timeout']) {
      const p = problemFromError(code) as DictationProblem;
      expect(DICTATION_MESSAGES[p].length).toBeGreaterThan(20);
    }
    expect(DICTATION_MESSAGES['no-on-device']).toMatch(/leaves the phone/);
  });
});
