-- NextAct Client Instrument — Round 1 schema.
--
-- Every client-owned table carries client_id and enables RLS. Policies require
-- the authenticated user to be a member of that client. This is written so an
-- isolated Supabase project can be provisioned per client later; the same
-- policies remain correct with a single client in the project.

create extension if not exists "pgcrypto";
-- pgvector is optional; retrieval falls back to full-text + recency if absent.
create extension if not exists "vector";

-- Identity ---------------------------------------------------------------
create table if not exists clients (
  id text primary key,
  preferred_name text,
  created_at timestamptz not null default now()
);

create table if not exists client_memberships (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references clients(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  unique (client_id, user_id)
);

-- Helper: client_ids the current user may access.
create or replace function app_client_ids()
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select client_id from client_memberships where user_id = auth.uid();
$$;

-- Conversations & messages ----------------------------------------------
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references clients(id) on delete cascade,
  title text not null default 'Conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references clients(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references clients(id) on delete cascade,
  type text not null,
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Four-layer memory ------------------------------------------------------
create table if not exists episodic_memories (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references clients(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  summary text not null,
  emotional_state text not null,
  source_message_ids text[] not null default '{}',
  source_file_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists semantic_memories (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references clients(id) on delete cascade,
  category text not null,
  statement text not null,
  confidence real not null default 0.5,
  status text not null default 'candidate'
    check (status in ('candidate','active','stale','superseded')),
  valid_from timestamptz not null default now(),
  valid_to timestamptz,
  source_ids text[] not null default '{}',
  supersedes_id uuid,
  last_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists procedural_memories (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references clients(id) on delete cascade,
  trigger text not null,
  mistake text not null,
  correction text not null,
  rule text not null,
  source_message_id uuid,
  status text not null default 'active' check (status in ('active','retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists style_profiles (
  client_id text primary key references clients(id) on delete cascade,
  sentence_length text not null default '',
  formality text not null default '',
  directness text not null default '',
  warmth text not null default '',
  use_of_metaphor text not null default '',
  preferred_vocabulary text[] not null default '{}',
  avoided_phrases text[] not null default '{}',
  rhythm_notes text not null default '',
  sample_source_ids text[] not null default '{}',
  last_updated_at timestamptz not null default now()
);

-- Files & chunks ---------------------------------------------------------
create table if not exists uploaded_files (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references clients(id) on delete cascade,
  path text not null,
  filename text not null,
  mime text not null,
  size bigint not null,
  status text not null default 'pending'
    check (status in ('pending','processing','indexed','failed')),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references clients(id) on delete cascade,
  file_id uuid not null references uploaded_files(id) on delete cascade,
  ordinal int not null default 0,
  content text not null,
  section text,
  page int,
  embedding vector(1536),
  created_at timestamptz not null default now()
);
create index if not exists document_chunks_fts
  on document_chunks using gin (to_tsvector('english', content));

-- Story evidence & legacy -----------------------------------------------
create table if not exists story_evidence (
  client_id text not null references clients(id) on delete cascade,
  area text not null,
  status text not null default 'empty'
    check (status in ('empty','emerging','supported','verified')),
  coverage_score real not null default 0,
  evidence_count int not null default 0,
  source_ids text[] not null default '{}',
  last_updated_at timestamptz,
  primary key (client_id, area)
);

create table if not exists legacy_entries (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references clients(id) on delete cascade,
  section text not null,
  title text not null,
  content text not null,
  source_ids text[] not null default '{}',
  evidence_status text not null default 'emerging'
    check (evidence_status in ('emerging','supported','verified')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Privacy-safe run metadata only. No prompt/response/transcript/memory text.
create table if not exists ai_runs (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references clients(id) on delete cascade,
  skill text not null,
  model text not null,
  input_tokens int,
  output_tokens int,
  latency_ms int not null default 0,
  status text not null default 'ok' check (status in ('ok','error')),
  error_category text,
  created_at timestamptz not null default now()
);

-- Row Level Security -----------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'clients','client_memberships','conversations','messages','events',
    'episodic_memories','semantic_memories','procedural_memories',
    'style_profiles','uploaded_files','document_chunks','story_evidence',
    'legacy_entries','ai_runs'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
  end loop;
end $$;

-- clients: readable/writable only by members.
create policy clients_member_all on clients
  for all using (id in (select app_client_ids()))
  with check (id in (select app_client_ids()));

create policy memberships_self on client_memberships
  for select using (user_id = auth.uid());

-- Generic per-tenant policy for all client-owned tables.
do $$
declare t text;
begin
  foreach t in array array[
    'conversations','messages','events','episodic_memories','semantic_memories',
    'procedural_memories','style_profiles','uploaded_files','document_chunks',
    'story_evidence','legacy_entries','ai_runs'
  ]
  loop
    execute format(
      'create policy %1$s_member_all on %1$s for all
         using (client_id in (select app_client_ids()))
         with check (client_id in (select app_client_ids()));', t);
  end loop;
end $$;
