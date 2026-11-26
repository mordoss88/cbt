# Turn on the AI coach

The coach runs through the Supabase Edge Function `coach` (supabase/functions/coach). It holds the Anthropic key
and the coach rules, checks that the person is signed in, streams Claude's answer and stores nothing.
It stays off until a model passed every safety test.

1. Create an API key at console.anthropic.com (a workspace with a monthly spend limit is a good idea).
2. Run the safety tests on your computer (costs a few dollars):
   `ANTHROPIC_API_KEY=sk-ant-... npm run coach-safety`
   Read docs/coach-safety-results.md, the replies too. Continue only if every case passed.
3. Deploy the function and set its secrets:
   ```
   npx supabase login
   npx supabase link --project-ref jtpdkndwseaekedrepdj
   npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-... COACH_ENABLED_MODEL=claude-opus-5-5
   npx supabase functions deploy coach
   ```
   Optional: `COACH_ALLOWED_USERS=<your Supabase user id>` so only you can use it while testing,
   and `COACH_MODEL=...` to use another model (run the safety tests for that model first).
4. In the app: More, AI coach (Claude), Turn on the coach. You must be signed in (Cloud backup screen).

Model: claude-opus-5-5 by default, with server-side fallbacks on, so a message that a safety classifier
declines is retried on Anthropic's recommended fallback model. Any change to supabase/functions/coach/rules.ts
or the model means running the safety tests again.
