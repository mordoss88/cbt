/* Data model. It matches the tracker's data (export format 2), so imported data needs no conversion. */

export type Rating = number; // 0-100

export interface ThoughtRecord {
  id: string;
  kind?: 'record' | 'journal';
  when?: string | null;
  createdAt?: string;
  updatedAt?: string;
  // Journal
  text?: string;
  // Part 1
  situation?: string;
  anxietyBefore?: Rating | null;
  sensations?: string[];
  thought?: string;
  beliefBefore?: Rating | null;
  safety?: string[];
  safetyOther?: string;
  // Part 2
  traps?: string[];
  evidenceFor?: string;
  evidenceAgainst?: string;
  balanced?: string;
  beliefAfter?: Rating | null;
  outcome?: string;
  anxietyAfter?: Rating | null;
}

export interface LadderTry {
  at: string;
  peak?: Rating | null;
  predicted?: string;
  happened?: string;
  noSafety?: boolean;
}

export interface LadderStep {
  id: string;
  text: string;
  rating: Rating;
  done?: boolean;
  createdAt?: string;
  ladder?: string;
  tries?: LadderTry[];
}

export interface Ladder {
  id: string;
  name: string;
}

export interface Checkin {
  at: string;
  anxiety?: number;
  interfere?: number;
  avoid?: number;
  [k: string]: unknown;
}

export interface TestResult {
  test: string;
  at: string;
  answers?: number[];
  score?: number;
  band?: string;
  traits?: Record<string, number>;
  impact?: number | string;
}

export interface CoachNote {
  id: string;
  text: string;
  createdAt?: string;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt?: string;
  /* The entry this message is about ("Talk it through with the coach"). */
  recId?: string;
  /* What the coach did while answering (saved a note, added a ladder step). */
  actions?: { type: 'memory' | 'ladder'; text: string }[];
  /* 'cut' when the answer stopped early, 'stopped' when the person stopped it. */
  flag?: 'cut' | 'stopped';
}

export interface AppData {
  records: ThoughtRecord[];
  ladders: Ladder[];
  ladder: LadderStep[];
  checkins: Checkin[];
  tests: TestResult[];
  notes: CoachNote[];
  chat: ChatMessage[];
}

export const emptyData = (): AppData => ({
  records: [],
  ladders: [],
  ladder: [],
  checkins: [],
  tests: [],
  notes: [],
  chat: [],
});
