/* Import from tracker: paste the text from the tracker's "Copy all my data", or pick its Export file.
   Preview what is in it, then merge it in. It is read on the phone. Nothing is sent anywhere,
   and nothing in the tracker changes. */
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { router } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { TextInput } from 'react-native';
import { parseTrackerExport, type ParseResult } from '../core/migrate';
import { useStore } from '../data/store';
import { fmtWhen } from '../ui/copy';
import { Btn, Bullets, P, Page, Panel, Row } from '../ui/kit';
import { C, F } from '../ui/theme';

export default function ImportScreen() {
  const { importData } = useStore();
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [done, setDone] = useState<{ added: number; updated: number } | null>(null);
  const [busy, setBusy] = useState(false);
  // The pasted export can be large, so the field is not controlled: the text lives in a ref.
  const pasted = useRef('');
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const [hasPaste, setHasPaste] = useState(false);

  const readPaste = () => setParsed(parseTrackerExport(pasted.current));

  const pick = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true, multiple: false });
    if (res.canceled || !res.assets?.[0]) return;
    const file = new File(res.assets[0].uri);
    try {
      setParsed(parseTrackerExport(await file.text()));
    } finally {
      try { file.delete(); } catch { /* the cached copy may already be gone */ }
    }
  };

  if (done) {
    return (
      <Page>
        <Panel sticker="Imported" stickerBg={C.calm}>
          <P>{done.added} items added{done.updated ? `, ${done.updated} updated` : ''}. {done.added === 0 && done.updated === 0 ? 'Everything in this file was already in the app.' : ''}</P>
          <P muted>Your tracker still has all its data. You can keep using it until you are happy with the app.</P>
          <Btn kind="primary" title="Done" onPress={() => router.back()} />
        </Panel>
      </Page>
    );
  }

  return (
    <Page>
      <Panel title="1 · Copy from the tracker">
        <Bullets items={[
          'Open the CBT Practice Log tracker in the Claude app.',
          'Wait until your entries show, then tap **Copy data** at the top, next to Guide.',
          'If a box with the text opens instead, tap **Copy again**, or select all of it and copy it.',
        ]} />
      </Panel>
      <Panel title="2 · Paste it here">
        <TextInput ref={input} multiline placeholder="Long-press here and tap Paste" placeholderTextColor={C.inkSoft}
          accessibilityLabel="Paste the text from the tracker" autoCorrect={false} autoCapitalize="none" spellCheck={false}
          onChangeText={(t) => { pasted.current = t; setHasPaste(!!t.trim()); }}
          style={{ fontFamily: F.body, fontSize: 13, color: C.ink, backgroundColor: C.paper, borderColor: C.ink, borderWidth: 2.5,
            borderRadius: 12, padding: 12, height: 120, textAlignVertical: 'top' }} />
        <Row>
          <Btn kind="primary" title="Read the pasted text" disabled={!hasPaste} onPress={readPaste} />
          {hasPaste ? <Btn kind="ghost" title="Clear" onPress={() => { input.current?.clear(); pasted.current = ''; setHasPaste(false); setParsed(null); }} /> : null}
        </Row>
        <P muted>Or, if you saved the Export file on this phone:</P>
        <Btn title="Choose the export file" onPress={pick} />
        <P muted>The text is read on this phone only.</P>
      </Panel>
      {parsed && !parsed.ok ? <Panel bg={C.pink}><P bold>{parsed.error}</P></Panel> : null}
      {parsed && parsed.ok ? (
        <Panel title="3 · Check and import" sticker="In this file" stickerBg={C.sky}>
          {parsed.exportedAt ? <P muted>Exported {fmtWhen(parsed.exportedAt)}</P> : null}
          <Bullets items={[
            `${parsed.counts.records} thought records and ${parsed.counts.journal} journal entries`,
            `${parsed.counts.steps} ladder steps in ${Math.max(1, parsed.counts.ladders)} ${parsed.counts.ladders === 1 ? 'ladder' : 'ladders'}`,
            `${parsed.counts.checkins} weekly check-ins and ${parsed.counts.tests} self-check results`,
            `${parsed.counts.notes} coach notes and ${parsed.counts.chat} chat messages (kept for the coach)`,
            ...(parsed.counts.quoteRatings ? [`${parsed.counts.quoteRatings} saying ratings`] : []),
          ]} />
          {parsed.warnings.map((w) => <P key={w} muted>{w}</P>)}
          <P>Entries already in the app are kept. Importing the same file again does not make copies.</P>
          <Row>
            <Btn kind="primary" title={busy ? 'Importing…' : 'Import'} disabled={busy} onPress={async () => {
              setBusy(true);
              try { setDone(await importData(parsed.data, parsed.quoteRatings)); } finally { setBusy(false); }
            }} />
            <Btn kind="ghost" title="Choose a file instead" onPress={pick} />
          </Row>
        </Panel>
      ) : null}
    </Page>
  );
}
