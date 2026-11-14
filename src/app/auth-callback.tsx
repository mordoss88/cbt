/* The sign-in link from the email opens cbtlog://auth-callback?code=... Finish the sign-in, then go to Cloud backup. */
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useBackup } from '../data/backup';
import { Btn, P, Page, Panel } from '../ui/kit';
import { C } from '../ui/theme';

export default function AuthCallback() {
  const params = useLocalSearchParams<{ code?: string; error_description?: string }>();
  const { finishLink, error } = useBackup();
  const started = useRef(false);
  const [done, setDone] = useState<boolean | null>(null);

  useEffect(() => {
    if (started.current || !params.code) return;
    started.current = true;
    finishLink(params.code).then(setDone);
  }, [params.code, finishLink]);

  if (done) return <Redirect href="/backup" />;
  const problem = params.error_description || (!params.code ? 'This sign-in link is not complete.' : done === false ? error : null);
  return (
    <Page>
      <Panel title="Signing in">
        {problem ? (
          <>
            <P>The sign-in did not work: {problem}</P>
            <P muted>Links work once and expire after a while. Ask for a new email in Cloud backup.</P>
            <Btn kind="primary" title="Back to Cloud backup" onPress={() => { setDone(true); }} />
          </>
        ) : <ActivityIndicator color={C.ink} />}
      </Panel>
    </Page>
  );
}
