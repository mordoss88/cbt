/* How-to-use guide. The in-app Guide and docs/guide.md are both made from this data.
   RULE: when a feature changes, update GUIDE, GUIDE_UPDATED and GUIDE_CHANGES in the same change,
   then run `npm run guide`. A test fails if docs/guide.md is out of date.
   A block is a paragraph (string) or a bullet list (array of strings). **bold** is allowed. */

export type GuideBlock = string | string[];
export interface GuideSection { id: string; title: string; blocks: GuideBlock[] }

export const GUIDE_UPDATED = '2026-11-19';
export const GUIDE: GuideSection[] = [
  { id: 'start', title: 'Start here', blocks: [
    'CBT Practice Log helps you practise CBT skills for anxiety: write down anxious moments, test your thoughts and face fears in small steps.',
    '**Self-help, not treatment.** It is not therapy and it does not diagnose. If you are in danger, tap **Quick help** for emergency numbers.',
    ['**Thoughts**: write down anxious moments (thought records) or free text (journal).',
      '**Ladder**: face fears in small steps, from easy to hard.',
      '**Patterns**: your week, self-checks and what stands out in your entries.',
      '**More**: your daily sayings, import, cloud backup, export, your country and privacy.',
      '**Quick help**: the pink button at the bottom of every screen. Open it during panic.'] ] },
  { id: 'today', title: 'Today: one saying and one small task', blocks: [
    'At the top of Thoughts you see the saying of the day and one small task, for example the weekly check-in, Part 2 of an entry, or your next ladder step.',
    ['Most sayings are about putting things off (procrastination) and about social anxiety. Each one has a short line on the CBT idea behind it.',
      'To get only one kind, tap **Your sayings** under the saying and pick **Both**, **Putting things off** or **Social anxiety**. Today\'s saying and the widget change right away.',
      'Tap **Helps** or **Not for me** under the saying. Sayings that help come back more often. Sayings you mark "Not for me" do not come back.',
      'Tap the main button of the task to do it. Tap **Not today** to hide it. Skipping a day is fine.'] ] },
  { id: 'widget', title: 'Home-screen widget: the saying of the day', blocks: [
    'Add the **Daily saying** widget to your home screen. It is part of this app, so you do not need another app.',
    ['iPhone: touch and hold the home screen, tap **Edit** then **Add Widget**, and pick CBT Practice Log.',
      'Android: touch and hold the home screen, tap **Widgets**, and pick CBT Practice Log. It takes one row. To make it bigger or smaller, touch and hold it and drag the edges.',
      'The saying changes every day, also when you do not open the app. On Android it can take up to an hour after midnight. The app sends the next 14 days at a time, so open it at least once every two weeks.',
      'Tap **Helps** or **Not for me** on the widget to rate the saying. The rating is saved in the app the next time you open it.',
      'On iPhone, tap the saying to open the app. Quick help is one tap away there.',
      'The widget shows only the saying. Your entries never appear on the home screen.'] ] },
  { id: 'thoughts', title: 'Thoughts: write down an anxious moment', blocks: [
    'Tap **+ Thought record**. It has two parts.',
    ['**Part 1, in the moment**: what happened, how anxious you are (0 to 100), what you feel in your body, the thought, how much you believe it, and what you did to feel safe.',
      '**Part 2, later, when you are calm**: thinking traps, facts for and against the thought, a balanced thought, what really happened, and how anxious you are now.'],
    'Tap **+ Journal** when you just want to write. A journal entry has no Part 2.',
    'To speak instead of type, tap **Speak** above a text box. Your words appear as you talk. Tap **Listening… tap to stop** when you are done.',
    ['Speech is turned into text on your phone. Nothing you say leaves the phone. If your phone cannot do that, the app tells you and voice input stays off. Then use the microphone on your keyboard.',
      'The first time, Android may ask you to download the offline speech pack for your language. Tap **Download**.'] ] },
  { id: 'rerate', title: 'Re-rate your anxiety after you calm down', blocks: [
    'In Part 2 you see your thought from Part 1, how much you believed it and how anxious you were.',
    ['Under **How anxious are you now?** you see the change, for example "Down 35 from 70".',
      'After you save, the entry shows anxiety before and after.'] ] },
  { id: 'ladder', title: 'Ladder: face fears in small steps', blocks: [
    'A fear ladder lists situations you avoid, rated from 0 (easy) to 100 (hardest). Start at the bottom.',
    ['Add steps two ways: **Write a step** or **Ideas**.',
      'Tap **Your next step** to log a try: first write what you predict, then rate your highest anxiety and what really happened.',
      'Do a step again and again. When your highest anxiety drops to about half of the rating, mark it done and go one step up.',
      'Make one ladder for each fear, for example "Driving" or "Social". Tap a ladder name to change ladder.'] ] },
  { id: 'patterns', title: 'Patterns: see your progress', blocks: [
    ['**This week**: your practice days (goal: 4 of 7) and the weekly check-in (three sliders, 30 seconds).',
      '**Self-checks**: the GAD-7 anxiety check every 2 weeks, and a short personality test. They are for self-monitoring, not a diagnosis.',
      '**What stands out**: anxiety per entry, and your most common thinking traps, safety behaviors and body signs.'] ] },
  { id: 'quickhelp', title: 'Quick help: during panic', blocks: [
    'The pink **Quick help** button is on every screen.',
    ['A breathing guide starts by itself: in for 4, out for 6.', '5-4-3-2-1 grounding, and answers to common panic thoughts.',
      'When to get medical help, emergency numbers and crisis lines for your country.', '**Log this moment** opens a new entry when the wave has passed.'] ] },
  { id: 'import', title: 'Move your data from the tracker', blocks: [
    'If you used the CBT Practice Log tracker on Claude, you can bring all your data into the app.',
    ['In the tracker (in the Claude app), wait until your entries show, then tap **Copy data** at the top, next to Guide. If a box with the text opens instead, select all of it and copy it.',
      'In the app, open **More**, tap **Import from tracker**, long-press the box, tap **Paste**, then tap **Read the pasted text**.',
      'If you saved the tracker\'s **Export** file on your phone, you can tap **Choose the export file** instead.',
      'You see what is in the file first. Tap **Import** to add it. Importing the same file again does not make copies.',
      'The tracker keeps your data. Nothing there is changed or deleted.'] ] },
  { id: 'backup', title: 'Cloud backup: keep a safe copy', blocks: [
    'Cloud backup keeps an encrypted copy of your data online, so you can get it back on a new phone. It is optional.',
    ['Open **More** and tap **Set up cloud backup**. Type your email and tap **Email me a sign-in link**. Open the email on this phone and tap the link: the app opens and signs you in.',
      'Choose a passphrase of at least 10 characters. A short sentence only you know works well. Write it down somewhere safe.',
      'Your data is encrypted on this phone with your passphrase before it is sent. The server only stores a locked file it cannot read.',
      'The app backs up by itself when you leave the app, if something changed. You can also tap **Back up now**.',
      'On a new phone: sign in with the same email and type your passphrase. Your data is added to the phone, nothing is deleted.',
      '**If you forget the passphrase, nobody can open the backup.** Your data on the phone is not affected. You can delete the old backup and start a new one.'] ] },
  { id: 'updates', title: 'App updates', blocks: [
    'Small improvements arrive by themselves. The app checks for an update when you open it and uses it the next time you open it. Bigger changes need a new install.' ] },
  { id: 'coach', title: 'The AI coach', blocks: [
    'The chat coach from the tracker is not in the app yet. Your coach notes and chat history are imported and kept, so the coach can use them when it comes.' ] },
  { id: 'data', title: 'Privacy and your data', blocks: [
    ['Your data stays on this phone, in an encrypted database. Without cloud backup there is no account and nothing leaves the phone.',
      'With cloud backup, only an encrypted copy leaves the phone. Without your passphrase nobody can read it.',
      'In **More** you can set your country, export all your data as a file, or delete everything.',
      'Voice input runs on the phone only. Your voice and the text never go to a server.',
      'No ads, no tracking, no analytics.'] ] },
];
export const GUIDE_CHANGES: [string, string][] = [
  ['2026-11-19', 'Speak your entries: a **Speak** button on text boxes, on the phone only. The widget buttons show their labels again.'],
  ['2026-11-17', 'The widget shows a new saying every day, even when the app stays closed. Pick the kind of sayings: both, putting things off, or social anxiety.'],
  ['2026-11-16', 'Move your data by copy and paste: **Copy all my data** in the tracker, then paste it in Import. New sayings about procrastination and social anxiety.'],
  ['2026-11-16', 'The Android widget is smaller: one row on the home screen, and you can resize it.'],
  ['2026-11-14', 'Cloud backup, encrypted on your phone with your passphrase. App updates arrive without a new install.'],
  ['2026-11-14', 'The app: thought records, journal, ladders, patterns, self-checks and Quick help work offline on your phone. Import from the tracker. The saying of the day, with a home-screen widget where you rate it.'],
];

export function guideMarkdown() {
  const out = ['# CBT Practice Log app: how to use it', '', '_Updated ' + GUIDE_UPDATED + '. Also in the app: open **More** and tap **Guide**._', ''];
  GUIDE.forEach((s) => {
    out.push('## ' + s.title, '');
    s.blocks.forEach((b) => {
      if (Array.isArray(b)) b.forEach((x) => out.push('- ' + x));
      else out.push(b);
      out.push('');
    });
  });
  out.push('## What changed', '');
  GUIDE_CHANGES.forEach((c) => out.push('- **' + c[0] + '**: ' + c[1]));
  return out.join('\n') + '\n';
}
