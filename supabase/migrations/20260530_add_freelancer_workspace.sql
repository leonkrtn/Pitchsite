-- Freelancer workspace: annotations, tasks, version history, revision rounds,
-- and project delivery/approval fields. Additive only.

-- ── Project delivery / approval fields ──────────────────────
alter table public.projects add column if not exists delivery_note text;
alter table public.projects add column if not exists approved_at timestamptz;
alter table public.projects add column if not exists revision_round integer not null default 0;

-- ── Freelancer's own annotations on the design ──────────────
create table if not exists public.project_annotations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  author_id uuid,
  kind text not null default 'pin' check (kind in ('pin','box','draw','callout')),
  visibility text not null default 'private' check (visibility in ('private','shared')),
  x_pct numeric not null default 0,
  y_pct numeric not null default 0,
  w_pct numeric,
  h_pct numeric,
  path jsonb,
  color text not null default '#1D4ED8',
  text text,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.project_annotations enable row level security;
drop policy if exists annotations_read on public.project_annotations;
drop policy if exists annotations_insert on public.project_annotations;
drop policy if exists annotations_update on public.project_annotations;
drop policy if exists annotations_delete on public.project_annotations;
create policy annotations_read   on public.project_annotations for select using (true);
create policy annotations_insert on public.project_annotations for insert with check (true);
create policy annotations_update on public.project_annotations for update using (true);
create policy annotations_delete on public.project_annotations for delete using (true);

-- ── Task / milestone checklist ──────────────────────────────
create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.project_tasks enable row level security;
drop policy if exists tasks_read on public.project_tasks;
drop policy if exists tasks_insert on public.project_tasks;
drop policy if exists tasks_update on public.project_tasks;
drop policy if exists tasks_delete on public.project_tasks;
create policy tasks_read   on public.project_tasks for select using (true);
create policy tasks_insert on public.project_tasks for insert with check (true);
create policy tasks_update on public.project_tasks for update using (true);
create policy tasks_delete on public.project_tasks for delete using (true);

-- ── Version history of uploaded design files ────────────────
create table if not exists public.project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  version_number integer not null default 1,
  file_url text not null,
  file_name text not null,
  note text,
  created_at timestamptz not null default now()
);
alter table public.project_versions enable row level security;
drop policy if exists versions_read on public.project_versions;
drop policy if exists versions_insert on public.project_versions;
drop policy if exists versions_delete on public.project_versions;
create policy versions_read   on public.project_versions for select using (true);
create policy versions_insert on public.project_versions for insert with check (true);
create policy versions_delete on public.project_versions for delete using (true);

-- ── Client-requested revision rounds ────────────────────────
create table if not exists public.project_revisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  round_number integer not null default 1,
  note text not null,
  requested_by text,
  status text not null default 'open' check (status in ('open','resolved')),
  created_at timestamptz not null default now()
);
alter table public.project_revisions enable row level security;
drop policy if exists revisions_read on public.project_revisions;
drop policy if exists revisions_insert on public.project_revisions;
drop policy if exists revisions_update on public.project_revisions;
create policy revisions_read   on public.project_revisions for select using (true);
create policy revisions_insert on public.project_revisions for insert with check (true);
create policy revisions_update on public.project_revisions for update using (true);

-- ── Realtime ────────────────────────────────────────────────
alter publication supabase_realtime add table public.project_annotations;
alter publication supabase_realtime add table public.project_revisions;
