/* About and privacy: country for help numbers, export everything, delete everything. */
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';
import * as Updates from 'expo-updates';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { buildInfoRows } from '../core/buildInfo';
import { COUNTRIES, dayKey, exportData } from '../core/cbt';
import { useStore } from '../data/store';
import { Btn, Bullets, P, Page, Panel, Row } from '../ui/kit';
import { C, F } from '../ui/theme';

export default function AboutScreen() {
  const { data, quotes, settings, setSettings, deleteAll } = useStore();
  const [confirm, setConfirm] = useState(false);
  const [msg, setMsg] = useState('');

  const doExport = async () => {
    const out = exportData({ ...data, quoteRatings: Object.values(quotes.ratings) }, Date.now());
    const file = new File(Paths.cache, `cbt-practice-log-${dayKey(Date.now())}.json`);
    try {
      if (file.exists) file.delete();
      file.create();
      await file.write(JSON.stringify(out, null, 2));
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Save your CBT Practice Log data' });
    } finally {
      // Do not leave a plain copy of the data in the cache.
      try { if (file.exists) file.delete(); } catch { /* ignore */ }
    }
  };

  return (
    <Page>
      <Panel title="What this app is">
        <Bullets items={[
          '**Self-help, not treatment.** It helps you practise CBT skills for anxiety. It is not therapy, it does not diagnose, and it does not replace a doctor or therapist.',
          '**Not for emergencies.** If you are in danger, call your emergency number. Quick help lists the numbers.',
        ]} />
      </Panel>
      <Panel title="Privacy">
        <Bullets items={[
          'Your data stays on this phone in an encrypted database. The key is kept in the phone\'s secure storage.',
          'No ads, no tracking and no analytics. Without cloud backup there is no account and nothing leaves the phone.',
          'Cloud backup is optional. It is encrypted on this phone with your passphrase, so the server cannot read it.',
          'The home-screen widget gets only the saying of the day.',
          'Voice input (Speak) turns speech into text on this phone only. If the phone cannot, voice input stays off. Nothing you say is sent anywhere.',
        ]} />
      </Panel>
      <Panel title="Your country, for the help numbers">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {COUNTRIES.map((c) => (
            <Pressable key={c.code} onPress={() => setSettings({ country: c.code })} accessibilityRole="radio" accessibilityState={{ checked: settings.country === c.code }}
              style={{ borderColor: C.ink, borderWidth: 2, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: settings.country === c.code ? C.sky : C.paper }}>
              <Text style={{ fontFamily: F.bodySemi, fontSize: 13, color: C.ink }}>{c.name}</Text>
            </Pressable>
          ))}
        </View>
      </Panel>
      <Panel title="Your data">
        <P>Export saves everything as one file, in the same format as the tracker. Keep it somewhere private.</P>
        <Btn title="Export all data" onPress={() => doExport().catch(() => setMsg('Export did not work. Try again.'))} />
        {msg ? <P bold>{msg}</P> : null}
        <View style={{ height: 6 }} />
        {confirm ? (
          <View style={{ gap: 8, backgroundColor: C.pink, borderColor: C.ink, borderWidth: 2.5, borderRadius: 14, padding: 12 }}>
            <P bold>Delete all entries, ladders, check-ins, self-checks, notes and ratings from this phone? This cannot be undone. It also signs you out of cloud backup. To delete the cloud copy too, do that first in Cloud backup.</P>
            <Row>
              <Btn kind="danger" title="Yes, delete everything" onPress={async () => { await deleteAll(); router.back(); }} />
              <Btn kind="ghost" title="Cancel" onPress={() => setConfirm(false)} />
            </Row>
          </View>
        ) : (
          <Btn kind="ghost" title="Delete everything" onPress={() => setConfirm(true)} />
        )}
      </Panel>
      <Panel title="Version">
        <P>Check this after an update to be sure you have the newest code.</P>
        {buildInfoRows({
          commitSha: process.env.EXPO_PUBLIC_COMMIT_SHA, commitMessage: process.env.EXPO_PUBLIC_COMMIT_MESSAGE, commitTime: process.env.EXPO_PUBLIC_COMMIT_TIME,
          updateId: Updates.updateId, updateCreatedAt: Updates.createdAt, isEmbedded: Updates.isEmbeddedLaunch,
          channel: Updates.channel, runtimeVersion: Updates.runtimeVersion,
        }).map(([k, v]) => (
          <Text key={k} selectable style={{ fontFamily: F.body, fontSize: 13, color: C.ink }}>
            <Text style={{ fontFamily: F.bodySemi }}>{k}: </Text>{v}
          </Text>
        ))}
      </Panel>
    </Page>
  );
}
