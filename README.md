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
- **Export / Delete everything**, country for help numbers, in-app Guide.

Not in yet: the AI coach (it needs a server proxy and a cost decision). Coach notes and chat history are imported and kept for it.

## Privacy

- All data is on the device in one SQLite database encrypted with SQLCipher (`expo-sqlite` with `useSQLCipher`). The 256-bit key is made on first start and kept in the Keychain / Keystore (`expo-secure-store`, this device only).
- No account, no server, no analytics, no network calls. Android backup is off (`allowBackup: false`).
- The widget gets only the saying text and its rating. Export files are deleted from the cache after sharing.

## Run it

Requires a development build (the widget, SQLCipher and the local Android module are native).

```sh
npm install --legacy-peer-deps   # react-dom peer conflict from the Google Fonts packages
npm test                          # 60 Jest tests for the core logic
npm run typecheck && npm run lint
npx expo run:ios                  # or: npx expo run:android, or eas build --profile development
```

Then add the "Daily saying" widget from the home screen.

## Layout

```
src/core/        pure logic, no React Native: tested with Jest
  cbt.ts         ported from the tracker's CBTCore (Today task, ladders, stats, week, self-checks, countries)
  quotes.ts      sayings, daily pick, ratings
  widgetSync.ts  widget props and reading ratings made on the widget
  migrate.ts     parse and merge the tracker's Export file
  guide.ts       the in-app Guide; docs/guide.md is generated from it (npm run guide)
src/data/        encrypted SQLite (db.ts) and the app store (store.tsx)
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
