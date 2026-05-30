-- ─────────────────────────────────────────────────────────────
--  Baseline schema (reconstructed from the live database).
--
--  The original tables were created via the Supabase dashboard and
--  never captured as a migration, so applying the migration chain to
--  a fresh / shadow DB failed with "relation public.projects does not
--  exist". This file recreates that pre-existing state so the later
--  20260527+ migrations (which ALTER these tables) replay cleanly.
--
--  Fully idempotent (create … if not exists, drop policy if exists),
--  so it is also safe to re-run against the existing database.
-- ─────────────────────────────────────────────────────────────

-- ── profiles ────────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null default '',
  email      text not null default '',
  avatar_url text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists profiles_own on public.profiles;
create policy profiles_own on public.profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);

-- ── projects (pre-migration columns only) ───────────────────
create table if not exists public.projects (
  id             uuid primary key default gen_random_uuid(),
  designer_id    uuid not null references auth.users(id) on delete cascade,
  name           text not null,
  amount         numeric,
  delivery_date  date,
  description    text,
  code           text not null unique,
  status         text not null default 'offen',
  file_url       text,
  file_name      text,
  client_name    text,
  client_email   text,
  client_phone   text,
  client_company text,
  client_website text,
  archived       boolean default false,
  created_at     timestamptz not null default now()
);
alter table public.projects enable row level security;
drop policy if exists projects_designer_all on public.projects;
drop policy if exists projects_client_read on public.projects;
create policy projects_designer_all on public.projects for all
  using (auth.uid() = designer_id);
create policy projects_client_read on public.projects for select
  using (code is not null);

-- ── project_pins (client feedback) ──────────────────────────
create table if not exists public.project_pins (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  x_pct      numeric not null,
  y_pct      numeric not null,
  comment    text not null,
  author     text not null default 'Kunde',
  resolved   boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.project_pins enable row level security;
drop policy if exists pins_read_public on public.project_pins;
drop policy if exists pins_insert_public on public.project_pins;
drop policy if exists pins_designer on public.project_pins;
create policy pins_read_public   on public.project_pins for select using (true);
create policy pins_insert_public on public.project_pins for insert with check (true);
create policy pins_designer      on public.project_pins for all
  using (exists (select 1 from public.projects p where p.id = project_pins.project_id and p.designer_id = auth.uid()));

-- ── project_signatures (contract signing) ───────────────────
create table if not exists public.project_signatures (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  signature_url text not null,
  client_name   text not null,
  signed_at     timestamptz not null default now()
);
alter table public.project_signatures enable row level security;
drop policy if exists signatures_insert_public on public.project_signatures;
drop policy if exists signatures_designer on public.project_signatures;
create policy signatures_insert_public on public.project_signatures for insert with check (true);
create policy signatures_designer      on public.project_signatures for select
  using (exists (select 1 from public.projects p where p.id = project_signatures.project_id and p.designer_id = auth.uid()));

-- ── project_messages (realtime chat) ────────────────────────
create table if not exists public.project_messages (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.projects(id) on delete cascade,
  sender_name      text not null,
  sender_id        uuid references auth.users(id) on delete set null,
  is_designer      boolean not null default false,
  message          text not null,
  read_by_designer boolean not null default false,
  created_at       timestamptz not null default now()
);
alter table public.project_messages enable row level security;
drop policy if exists project_messages_select on public.project_messages;
drop policy if exists project_messages_insert on public.project_messages;
drop policy if exists project_messages_update on public.project_messages;
create policy project_messages_select on public.project_messages for select using (true);
create policy project_messages_insert on public.project_messages for insert with check (true);
create policy project_messages_update on public.project_messages for update using (auth.uid() is not null);

do $$
begin
  alter publication supabase_realtime add table public.project_messages;
exception when duplicate_object then null;
end $$;

-- ── waitlist ────────────────────────────────────────────────
create table if not exists public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null unique,
  language   text default 'de',
  confirmed  boolean default false,
  token      text unique,
  created_at timestamptz default now()
);
alter table public.waitlist enable row level security;

-- ── auth → profiles trigger ─────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
