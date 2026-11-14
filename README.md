# CBT Practice Log (Expo app)

An offline-first CBT self-help app for anxiety. It moves the CBT Practice Log tracker (a Claude artifact) to a real app on the phone, and adds a home-screen widget with a daily CBT saying you can rate.

**Self-help, not treatment.** The app helps people practise CBT skills. It is not therapy and does not diagnose. Quick help (breathing, grounding, panic answers, emergency and crisis numbers) is one tap away on every screen.

## What is in it

- **Thoughts**: two-part thought records and a free-text journal. The Today card picks one small task (same rules as the tracker).
- **Ladder**: several fear ladders, tries with prediction, peak anxiety and outcome, "ready to mark done" at half the rating.
- **Patterns**: this week, weekly check-in, GAD-7 and Mini-IPIP self-checks, anxiety per entry, top traps, safety behaviors and body signs.
- **Saying of the day**: 40 CBT sayings written for the app. "Helps" sayings come back more often, "Not for me" sayings do not come back.
- **Home-screen widget** (iOS and Android, part of the app): today's saying with Helps / Not for me buttons.
- **Import from tracker**: reads the tracker's Export file (format 2 or 1) and merges it. Importing twice makes no copies.
- **Cloud backup** (optional): encrypted on the phone with the person's passphrase, stored in its own Supabase project. Restore merges, so nothing is lost.
- **Over-the-air updates** (EAS Update): JS changes reach installed builds without a rebuild.
- **Export / Delete everything**, country for help numbers, in-app Guide.

Not in yet: the AI coach (it needs a server proxy and a cost decision). Coach notes and chat history are imported and kept for it.

## Privacy

- All data is on the device in one SQLite database encrypted with SQLCipher (`expo-sqlite` with `useSQLCipher`). The 256-bit key is made on first start and kept in the Keychain / Keystore (`expo-secure-store`, this device only).
- No analytics, no ads. Without cloud backup: no account and no network calls except the update check. Android backup is off (`allowBackup: false`).
- Cloud backup is end-to-end encrypted: the Export JSON is encrypted on the phone with XChaCha20-Poly1305 (`@noble/ciphers`), with a key from the passphrase via scrypt (N=2^15, r=8). Supabase stores only the envelope, one row per account, with row level security. The derived key stays in the Keychain / Keystore; the sign-in session is kept in the encrypted database. A lost passphrase means the backup cannot be opened.
- The widget gets only the saying text and its rating. Export files are deleted from the cache after sharing.

## Run it

Requires a development build (the widget, SQLCipher and the local Android module are native).

```sh
npm install                       # .npmrc sets legacy-peer-deps (Google Fonts react-dom peer)
npm test                          # 67 Jest tests for the core logic
npm run typecheck && npm run lint
npx expo run:ios                  # or: npx expo run:android, or eas build --profile development
```

Then add the "Daily saying" widget from the home screen.

Cloud backup uses the public Supabase values in `.env`. Put overrides in `.env.local`.

### Build for your phone (EAS)

```sh
npm i -g eas-cli && eas login
eas init                                   # links the app to your Expo account (once)

# Android: installable APK
eas build -p android --profile preview      # standalone app, no dev server needed
eas build -p android --profile development  # dev client, run `npx expo start` to load JS

# iOS: needs an Apple Developer account
eas device:create                           # register your iPhone (once), open the link on the phone
eas build -p ios --profile preview          # standalone app, installed via the link/QR from EAS
eas build -p ios --profile development      # dev client
```

Each build ends with a link and QR code. Open it on the phone to install. On iPhone, also turn on Settings > Privacy & Security > Developer Mode for internal builds.

### Two ways to work

- **Development build + Metro** (at the laptop): `eas build -p android --profile development`, install, then `npx expo start`. Hot reload.
- **Preview build + EAS Update** (daily use): `eas build -p android --profile preview`. Every push to `main` runs `.github/workflows/eas-update.yml`, which checks types and tests, then publishes to the `preview` channel. The app downloads it on start and uses it on the next start.

The runtime version uses the `fingerprint` policy: a change to native code (new native package, plugin, widget layout) makes a new runtime, so old builds never get an update they cannot run. Those changes need a new build.

### One-time setup (EAS Update and cloud backup)

1. `git pull`, then `eas update:configure`. It adds `updates.url` and `extra.eas.projectId` to app.json. Commit and push.
2. expo.dev > Account settings > Access tokens: create a token. In GitHub, repo Settings > Secrets and variables > Actions, add it as `EXPO_TOKEN`.
3. Supabase: its own project `cbt-practice-log` (`jtpdkndwseaekedrepdj`, Frankfurt, free plan). Done on 2026-11-14:
   - SQL Editor: run `supabase/migrations/20261114000000_cbt_backups.sql` (done).
   - Authentication > URL Configuration > Redirect URLs: `cbtlog://auth-callback` (done). The sign-in email link opens the app through it.
   - Optional: with custom SMTP you can edit the email templates and add `{{ .Token }}`; the app then also accepts the 6-digit code.
4. The public Supabase URL and publishable key are in the committed `.env`, so builds, `eas update` and Metro all get them.
5. Build once: `eas build -p android --profile preview` (and iOS if needed). From then on, JS changes ship by pushing to `main`.

## Layout

```
src/core/        pure logic, no React Native: tested with Jest
  cbt.ts         ported from the tracker's CBTCore (Today task, ladders, stats, week, self-checks, countries)
  quotes.ts      sayings, daily pick, ratings
  widgetSync.ts  widget props and reading ratings made on the widget
  migrate.ts     parse and merge the tracker's Export file
  backup.ts      backup encryption (scrypt + XChaCha20-Poly1305), envelope, payload
  guide.ts       the in-app Guide; docs/guide.md is generated from it (npm run guide)
src/data/        encrypted SQLite (db.ts), the app store (store.tsx), cloud backup (cloud.ts, backup.tsx)
supabase/        SQL for the cbt_backups table with RLS
src/widgets/     QuoteWidget.ios.tsx (SwiftUI), QuoteWidget.android.tsx (Glance), sync.ts
src/app/         Expo Router screens
modules/widget-props/  local Expo module (Android): reads the widget's stored props
__tests__/       Jest tests (TZ pinned to Europe/Belgrade)
```

## How widget ratings reach the app

The widget uses `expo-widgets` (first-party, SDK 58). A tap on Helps / Not for me runs in the widget runtime without the app: it sets `rating` and appends `quoteId:rating:ms` to the widget prop `pending`. When the app opens or comes back to the front it reads the props back (iOS: `getTimeline()`, Android: the local `widget-props` module, because `expo-widgets` has no Android getter), saves each pending rating (newest wins, a later in-app rating is kept), and pushes fresh props. While the app runs, `addUserInteractionListener` triggers the same sync right away. iOS gets a 7-day timeline so the saying changes at midnight without opening the app; Android updates when the app opens.

## Rules for changes

- Write tests for core logic changes.
- When a feature changes, update `GUIDE`, `GUIDE_UPDATED` and `GUIDE_CHANGES` in `src/core/guide.ts`, then run `npm run guide`. A test fails if `docs/guide.md` is out of date.
- Keep the safety rules, the Quick help panel and the warm comic design.
