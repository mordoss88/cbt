-- CBT Practice Log: encrypted backups. One row per account.
-- The app encrypts the backup on the phone (XChaCha20-Poly1305, key from the person's passphrase).
-- This table only ever holds the encrypted envelope: nobody with database access can read the data.
-- Run in the cbt-practice-log Supabase project (it only adds this one table).

create table if not exists public.cbt_backups (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  envelope text not null check (length(envelope) < 20000000),
  content_hash text,
  device text,
  updated_at timestamptz not null default now()
);

alter table public.cbt_backups enable row level security;

-- Each person sees and changes only their own backup.
create policy "cbt_backups select own" on public.cbt_backups
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "cbt_backups insert own" on public.cbt_backups
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "cbt_backups update own" on public.cbt_backups
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "cbt_backups delete own" on public.cbt_backups
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.cbt_backups from anon;
grant select, insert, update, delete on public.cbt_backups to authenticated;
