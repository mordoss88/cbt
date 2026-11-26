/* Coach proxy: a Supabase Edge Function between the app and Claude.
   - Only signed-in people of this project can use it (Supabase JWT), and optionally only the ids in COACH_ALLOWED_USERS.
   - It holds the Anthropic API key (secret ANTHROPIC_API_KEY) and the coach rules (rules.ts), so the app has neither.
   - Safety gate: it runs only when the secret COACH_ENABLED_MODEL names the model in use, which is set after that model
     passed all 27 coach safety tests (scripts/coach-safety.ts).
   - It stores nothing and logs no content: no database writes, and logs have only status codes.
   Answer: one JSON object per line: {"type":"text","text":...} while Claude writes, then {"type":"done",...} or {"type":"error",...}. */
import Anthropic from 'npm:@anthropic-ai/sdk@1.14.0';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { DEFAULT_MODEL, checkRequest, coachParams, type CoachBody } from './rules.ts';

const MODEL = Deno.env.get('COACH_MODEL') || DEFAULT_MODEL;
const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info' };

function fail(status: number, code: string) {
  console.log(JSON.stringify({ status, code }));
  return new Response(JSON.stringify({ type: 'error', code }), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') return fail(405, 'other');

  // Who is asking. The gateway already checked the JWT; this gets the user id.
  const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, (Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY'))!, { auth: { persistSession: false } });
  const { data: who } = await sb.auth.getUser(jwt);
  if (!who?.user) return fail(401, 'signed-out');
  const allowed = (Deno.env.get('COACH_ALLOWED_USERS') || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (allowed.length && !allowed.includes(who.user.id)) return fail(403, 'not-allowed');

  if (Deno.env.get('COACH_ENABLED_MODEL') !== MODEL) return fail(503, 'not-enabled');

  let body: CoachBody;
  try { body = await req.json(); } catch { return fail(400, 'other'); }
  const bad = checkRequest(body);
  if (bad) return fail(bad === 'too-large' ? 413 : 400, bad === 'too-large' ? 'too-large' : 'other');

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(ctl) {
      const send = (o: unknown) => ctl.enqueue(enc.encode(JSON.stringify(o) + '\n'));
      try {
        // deno-lint-ignore no-explicit-any
        const s = anthropic.beta.messages.stream(coachParams(body, MODEL) as any, { signal: req.signal });
        s.on('text', (t: string) => send({ type: 'text', text: t }));
        const msg = await s.finalMessage();
        if (msg.stop_reason === 'refusal') send({ type: 'error', code: 'refused' });
        else send({ type: 'done', stop_reason: msg.stop_reason, content: msg.content });
        console.log(JSON.stringify({ status: 200, stop: msg.stop_reason, in: msg.usage?.input_tokens, out: msg.usage?.output_tokens }));
      } catch (e) {
        const status = (e as { status?: number }).status ?? 0;
        const code = status === 429 ? 'rate-limited' : status === 529 || status === 503 ? 'overloaded' : status === 413 ? 'too-large' : 'other';
        console.log(JSON.stringify({ status: status || 500, code }));
        send({ type: 'error', code });
      } finally {
        ctl.close();
      }
    },
  });
  return new Response(stream, { headers: { ...CORS, 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-store' } });
});
