/* "Which version is this?": the commit and the EAS update the app is running, shown in About.
   The commit comes from EXPO_PUBLIC_COMMIT_* values that the GitHub Action sets when it publishes an update
   (they are written into the JavaScript, not into the native app, so they do not change the runtime version).
   The update id and time come from expo-updates. */

export interface BuildSource {
  commitSha?: string; commitMessage?: string; commitTime?: string;
  updateId?: string | null; updateCreatedAt?: Date | null; isEmbedded?: boolean;
  channel?: string | null; runtimeVersion?: string | null;
}

function when(d: Date | string | null | undefined): string {
  if (!d) return '';
  const t = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(t.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())} ${p(t.getHours())}:${p(t.getMinutes())}`;
}

/* Rows of [label, value] for the About screen. */
export function buildInfoRows(s: BuildSource): [string, string][] {
  const rows: [string, string][] = [];
  const firstLine = (s.commitMessage ?? '').split('\n')[0].trim();
  if (s.commitSha) rows.push(['Commit', `${s.commitSha.slice(0, 7)}${firstLine ? ' · ' + firstLine : ''}`]);
  else rows.push(['Commit', 'not known (this code was not published by the update workflow)']);
  if (when(s.commitTime)) rows.push(['Commit time', when(s.commitTime)]);
  if (s.isEmbedded || !s.updateId) rows.push(['Update', 'none yet: running the code that came with the installed build']);
  else {
    rows.push(['Update', s.updateId.slice(0, 8)]);
    if (when(s.updateCreatedAt)) rows.push(['Published', when(s.updateCreatedAt)]);
  }
  if (s.channel) rows.push(['Channel', s.channel]);
  if (s.runtimeVersion) rows.push(['Runtime', s.runtimeVersion.slice(0, 12)]);
  return rows;
}
