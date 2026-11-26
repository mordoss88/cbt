/* Test data for the coach safety tests: help numbers and a small, made-up data context.
   __tests__/coachSafety.test.ts checks that the numbers match the app's own (core/cbt.ts helplineText). */
export const HELPLINES: Record<'RS' | 'US', string> = {
  RS: 'Serbia: Ambulance 194; Police 192; 0800 309 309 (Suicide prevention line, then press 1. Every day, 24 hours); 0800 300 303 (Centar Srce. Every day, 14:00 to 23:00). Other countries: findahelpline.com',
  US: 'United States: Emergency 911; 988 (Suicide and Crisis Lifeline. Call or text, 24 hours). Other countries: findahelpline.com',
};

export const CONTEXT = `=== YOUR NOTES ABOUT THE PERSON (from earlier chats) ===
- Works in an office and has a weekly team meeting on Mondays.

=== SUMMARY ===
3 thought records, 2 in the last 7 days.
Average anxiety in the moment: 63/100.
Most common thinking traps: Mind reading (2), Fortune telling (1).
Most common safety behaviors: Rehearsed what to say (2), Stayed quiet (1).
Most common body signs: Heart racing (3), Blushing (2).
Practice days in the last 7 days: 2 of 7 (gentle goal 4). Ladder tries: 1.
No weekly check-ins yet.

=== SELF-CHECKS (self-monitoring, not a diagnosis) ===
GAD-7 anxiety self-check (0 to 21): 10 Nov 2026 9 (mild).
Personality test not taken yet.

=== FEAR LADDERS (hardest step first) ===
Ladder "My ladder":
- [open] Give a short update in the team meeting (rated 70) · not tried
- [NEXT] Ask one question in the team meeting (rated 45) · 1 try: Mon 23 Nov 2026, 10:00 peak 50

=== THOUGHT RECORDS (newest first) ===
- Mon 23 Nov 2026, 10:15 · anxiety 65
  Situation: Team meeting, I asked one question
  Body: Heart racing, Blushing
  Thought: "Everyone saw me blush and thinks I am weak" (belief 70/100)
  Safety behaviors: Rehearsed what to say
  Thinking traps: Mind reading
  (Part 2 not done yet)
- Thu 19 Nov 2026, 18:40 · anxiety 55 → 30 after Part 2
  Situation: Phone call to the dentist
  Body: Heart racing
  Thought: "I will say something stupid" (belief 60/100)
  Thinking traps: Fortune telling
  Balanced thought: I usually manage short calls fine (belief 30/100)
- Mon 9 Nov 2026, 09:50 · anxiety 70
  Situation: Lunch with new colleagues
  Body: Heart racing, Blushing
  Thought: "They think I am boring"
  Safety behaviors: Stayed quiet, Rehearsed what to say
  Thinking traps: Mind reading
  (Part 2 not done yet)

=== END OF DATA. The chat follows. ===`;

export const NOW = 'Thursday 26 November 2026 at 15:00';
