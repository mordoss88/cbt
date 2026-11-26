/* Sends one coach request to our proxy (supabase/functions/coach) and reads the streamed answer.
   Runs only from the chat screen, after the person turned the coach on. Uses the Supabase sign-in token;
   the Anthropic key is only on the server. */
import type { SupabaseClient } from '@supabase/supabase-js';
import { fetch } from 'expo/fetch';
import { parseCoachStream, type CoachRequest, type SendResult } from '../core/coach';

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function sendToCoach(c: SupabaseClient, body: CoachRequest, onText: (t: string) => void, signal?: AbortSignal): Promise<SendResult> {
  const { data } = await c.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { error: 'signed-out', status: 401 };
  let res: Awaited<ReturnType<typeof fetch>>;
  try {
    res = await fetch(`${URL}/functions/v1/coach`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, apikey: KEY ?? '', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch {
    return { error: signal?.aborted ? 'stopped' : 'network' };
  }
  if (!res.ok || !res.body) {
    let code = '';
    try { code = String((await res.json())?.code ?? ''); } catch { /* not JSON */ }
    return { error: code, status: res.status };
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let done: SendResult | null = null;
  try {
    for (;;) {
      const { value, done: end } = await reader.read();
      if (end) break;
      buf += dec.decode(value, { stream: true });
      const p = parseCoachStream(buf);
      buf = p.rest;
      for (const e of p.events) {
        if (e.type === 'text') onText(e.text);
        else if (e.type === 'done') done = { stop_reason: e.stop_reason, content: e.content };
        else done = { error: e.code };
      }
    }
  } catch {
    return { error: signal?.aborted ? 'stopped' : 'network' };
  }
  return done ?? { error: 'network' };
}
