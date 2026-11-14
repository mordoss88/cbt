/* UI text for the Today task, the same words as the tracker. */
import { ladderList, stepLadder, trapName, type TodayTask } from '../core/cbt';
import type { AppData } from '../core/types';

export const TRAP_Q: Record<string, string> = {
  mind: 'What do I actually know about what they think?',
  fortune: 'How did it really go the last few times?',
  catastrophe: 'What is the most likely result, not the worst one?',
  spotlight: 'How much do I notice when other people are nervous?',
  allnothing: 'What would "good enough" look like here?',
  discount: 'What went well today, even a little?',
  should: 'Would I hold a friend to this rule?',
  label: 'What would I call a friend who did the same thing?',
};

export function fmtWhen(iso?: string | null) {
  const t = Date.parse(iso ?? '');
  if (isNaN(t)) return '';
  return new Date(t).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
export function fmtDay(t: number) {
  return new Date(t).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}
const trunc = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

export function taskCopy(task: TodayTask, d: AppData) {
  switch (task.kind) {
    case 'checkin':
      return { title: 'Weekly check-in', go: 'Start', href: '/checkin',
        text: 'Three quick sliders about your last 7 days. It takes about 30 seconds and shows your progress over time.',
        why: 'Rating the same three things every week turns a vague feeling into a trend you can see. Small changes are easier to notice.' };
    case 'test':
      return { title: 'Anxiety self-check', go: 'Start', href: '/test?id=gad7',
        text: 'Seven quick questions about the last 2 weeks (GAD-7). Taking it every 2 weeks shows how your anxiety changes over time.',
        why: 'A short, well-known questionnaire, answered the same way every 2 weeks, shows change that is hard to notice from day to day.' };
    case 'part2': {
      const r = d.records.find((x) => x.id === task.id);
      return { title: 'Finish Part 2', go: 'Do Part 2', href: `/record?id=${task.id}&part=2`,
        text: 'Your entry from ' + fmtWhen(r?.when || r?.createdAt) + (r?.situation ? ': "' + trunc(r.situation, 80).replace(/[.!?…\s]+$/, '') + '"' : '') +
          '. Look at the facts for and against the thought, then write a balanced one.',
        why: 'Part 2 is where the change happens. When you test a thought against the facts while you are calm, it loses some of its grip.' };
    }
    case 'ladder': {
      const s = d.ladder.find((x) => x.id === task.id);
      const lt = s?.tries?.[s.tries.length - 1];
      const ls = ladderList(d.ladders);
      const ld = s && ls.length > 1 ? ls.find((l) => l.id === stepLadder(s, d.ladders)) : null;
      return { title: 'Try your next ladder step', go: 'Open the step', href: `/try?step=${task.id}`,
        text: '"' + (s?.text || '') + '"' + (ld ? ' in your ' + ld.name + ' ladder' : '') + ', rated ' + (s?.rating ?? '') + '. ' +
          (lt ? 'Last try: ' + fmtDay(Date.parse(lt.at)) + ', highest anxiety ' + lt.peak + '. ' : '') + 'Write what you predict first. Afterwards, rate your highest anxiety.',
        why: 'When you face a feared situation in small steps and stay until the anxiety drops, your brain learns that it is safer than it feels.' };
    }
    case 'log':
      return d.records.length
        ? { title: 'Log one moment', go: 'New entry', href: '/record',
          text: 'Nothing logged for a few days. Think of one moment today when you felt even a little anxious, and write Part 1.',
          why: 'Writing a moment down soon after it happens catches the exact thought. That thought is what you work on later.' }
        : { title: 'Log your first moment', go: 'New entry', href: '/record',
          text: 'Think of one recent moment when you felt anxious, and write Part 1. Do Part 2 later, when you are calm.',
          why: 'Writing a moment down soon after it happens catches the exact thought. That thought is what you work on later.' };
    case 'build-ladder':
      return { title: 'Start your fear ladder', go: 'Open the ladder', href: '/ladder',
        text: 'Add one situation you avoid because of anxiety, and rate how hard it feels from 0 to 100.',
        why: 'A ladder turns a big fear into small steps that you can practise one at a time.' };
    case 'pattern':
      return { title: 'Catch your thinking trap', go: 'I will try it', href: '',
        text: 'Your most common thinking trap is ' + trapName(task.trap) + '. Today, when you notice it, ask yourself: "' + (TRAP_Q[task.trap] || 'What are the facts here?') + '"',
        why: 'Naming a trap when it happens puts some space between you and the thought. Then you can choose how to respond.' };
    default:
      return { title: 'Nothing is due today', go: '', href: '', text: 'Quick help and your ladder are always here when you need them.', why: '' };
  }
}
