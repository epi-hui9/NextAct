-- Round 2: private vaults, onboarding, push reminders.
-- Depends on 0001_init.sql (clients, memberships, conversations, RLS helpers).

-- Profiles bind auth.users to a private client vault (1:1 for the pilot).
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  client_id text not null references clients(id) on delete cascade,
  preferred_name text,
  onboarding_completed_at timestamptz,
  timezone text not null default 'America/Chicago',
  reminder_enabled boolean not null default false,
  reminder_last_sent_local_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id)
);

alter table profiles enable row level security;

create policy profiles_own on profiles
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Active reflection prompt continuity on a conversation thread.
alter table conversations
  add column if not exists active_prompt text;

-- Web Push subscriptions (per authenticated user).
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

alter table push_subscriptions enable row level security;

create policy push_own on push_subscriptions
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Privacy-safe reminder delivery attempts (no conversation text).
create table if not exists reminder_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_date date not null,
  status text not null check (status in ('sent', 'failed', 'skipped')),
  error_category text,
  created_at timestamptz not null default now(),
  unique (user_id, local_date)
);

alter table reminder_deliveries enable row level security;

-- Users never read delivery logs from the client; service role only.
create policy reminder_deliveries_deny_all on reminder_deliveries
  for all
  using (false)
  with check (false);

-- Index for cron selection.
create index if not exists profiles_reminder_idx
  on profiles (reminder_enabled, timezone)
  where reminder_enabled = true;
