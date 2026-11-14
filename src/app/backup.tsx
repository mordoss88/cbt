/* Cloud backup: sign in with an email code, set a passphrase, back up and restore.
   The backup is encrypted on the phone before it leaves. */
import { useState } from 'react';
import { ActivityIndicator, Switch, Text, View } from 'react-native';
import { MIN_PASSPHRASE } from '../core/backup';
import { useBackup } from '../data/backup';
import { fmtWhen } from '../ui/copy';
import { Btn, Bullets, Field, P, Page, Panel, Row } from '../ui/kit';
import { C, F } from '../ui/theme';

const secret = { multiline: false, secureTextEntry: true, autoCapitalize: 'none' as const, autoCorrect: false };

export default function BackupScreen() {
  const b = useBackup();
  const [email, setEmail] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [pass, setPass] = useState('');
  const [repeat, setRepeat] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [done, setDone] = useState('');
  const summary = (s: { added: number; updated: number } | null) => {
    if (s) setDone(s.added || s.updated ? `Restored: ${s.added} added, ${s.updated} updated.` : 'Restored. Everything was already on this phone.');
  };

  return (
    <Page>
      <Panel title="How it works">
        <Bullets items={[
          'Your data is **encrypted on this phone** with your passphrase before it goes to the cloud. The server only stores a locked file it cannot read.',
          'The app still works without internet. It backs up when you leave the app, if something changed.',
          '**Keep your passphrase safe.** If you forget it, nobody can open the backup. Your data on this phone is not affected.',
        ]} />
      </Panel>

      {b.phase === 'loading' ? <ActivityIndicator color={C.ink} /> : null}

      {b.phase === 'off' ? (
        <Panel><P>Cloud backup is not set up in this version of the app. For now, save a copy with Export in About, privacy and your data.</P></Panel>
      ) : null}

      {b.phase === 'signed-out' ? (
        <Panel title="1. Sign in with your email">
          <Field label="Email" value={email} onChangeText={setEmail} multiline={false} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" />
          <Btn kind={codeSent ? 'plain' : 'primary'} title={codeSent ? 'Send a new email' : 'Email me a sign-in link'} disabled={!email.includes('@') || !!b.busy}
            onPress={async () => { if (await b.sendCode(email)) setCodeSent(true); }} />
          {codeSent ? (
            <>
              <P>We sent an email to {email.trim()}. Open it on this phone and tap the sign-in link. The app opens and signs you in. It can take a minute.</P>
              <P muted>If the email has a 6-digit code, you can type it here instead.</P>
              <Field label="Code from the email" value={code} onChangeText={setCode} multiline={false} keyboardType="number-pad" autoComplete="one-time-code" />
              <Btn kind="primary" title="Sign in" disabled={code.trim().length < 6 || !!b.busy} onPress={() => b.verifyCode(email, code)} />
            </>
          ) : null}
        </Panel>
      ) : null}

      {b.phase === 'need-passphrase' && b.cloudHasBackup ? (
        <Panel title="2. Open your backup">
          <P>There is a backup for {b.email}. Enter the passphrase you chose. Its data is added to what is on this phone, nothing is deleted.</P>
          <Field label="Passphrase" value={pass} onChangeText={setPass} {...secret} />
          <Btn kind="primary" title="Open and restore" disabled={!pass || !!b.busy} onPress={async () => { summary(await b.unlock(pass)); setPass(''); }} />
          <P muted>Forgot it? You can delete the cloud backup below and start a new one with the data on this phone.</P>
        </Panel>
      ) : null}

      {b.phase === 'need-passphrase' && !b.cloudHasBackup ? (
        <Panel title="2. Choose a passphrase">
          <P>At least {MIN_PASSPHRASE} characters. A short sentence only you know works well. Write it down somewhere safe.</P>
          <Field label="Passphrase" value={pass} onChangeText={setPass} {...secret} />
          <Field label="Passphrase again" value={repeat} onChangeText={setRepeat} {...secret} />
          <Btn kind="primary" title="Turn on cloud backup" disabled={!pass || !!b.busy}
            onPress={async () => { await b.createPassphrase(pass, repeat); setPass(''); setRepeat(''); }} />
        </Panel>
      ) : null}

      {b.phase === 'ready' ? (
        <Panel title="Cloud backup is on" sticker="Encrypted" stickerBg={C.calm}>
          <P>{b.lastAt ? `Last backup: ${fmtWhen(b.lastAt)}.` : 'No backup yet.'} Signed in as {b.email}.</P>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Switch value={b.auto} onValueChange={b.setAuto} accessibilityLabel="Back up when I leave the app" />
            <Text style={{ fontFamily: F.bodySemi, fontSize: 15, color: C.ink, flex: 1 }}>Back up when I leave the app</Text>
          </View>
          <Row>
            <Btn kind="primary" title="Back up now" disabled={!!b.busy} onPress={b.backupNow} />
            <Btn title="Restore from backup" disabled={!!b.busy} onPress={async () => summary(await b.restore())} />
          </Row>
          <P muted>Restore adds what is in the backup to this phone. It does not delete anything here.</P>
        </Panel>
      ) : null}

      {b.busy ? <Row><ActivityIndicator color={C.ink} /><P>{b.busy}</P></Row> : null}
      {b.error ? <P bold style={{ color: C.berry }}>{b.error}</P> : null}
      {done ? <P bold style={{ color: C.skyDeep }}>{done}</P> : null}

      {b.phase === 'ready' || b.phase === 'need-passphrase' ? (
        <Panel title="Account">
          {confirmDelete ? (
            <View style={{ gap: 8, backgroundColor: C.pink, borderColor: C.ink, borderWidth: 2.5, borderRadius: 14, padding: 12 }}>
              <P bold>Delete the backup from the cloud? Your data on this phone stays.</P>
              <Row>
                <Btn kind="danger" title="Yes, delete the cloud backup" onPress={async () => { await b.deleteCloud(); setConfirmDelete(false); }} />
                <Btn kind="ghost" title="Cancel" onPress={() => setConfirmDelete(false)} />
              </Row>
            </View>
          ) : (
            <Row>
              <Btn kind="ghost" title="Sign out" disabled={!!b.busy} onPress={b.signOut} />
              {b.phase === 'ready' || b.cloudHasBackup ? <Btn kind="ghost" title="Delete cloud backup" onPress={() => setConfirmDelete(true)} /> : null}
            </Row>
          )}
        </Panel>
      ) : null}
    </Page>
  );
}
