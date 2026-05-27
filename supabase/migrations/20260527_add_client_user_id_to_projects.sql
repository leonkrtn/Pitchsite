-- Verknüpft ein Projekt mit dem Kunden-Account sobald dieser sich registriert
alter table public.projects
  add column if not exists client_user_id uuid references auth.users(id) on delete set null default null;

create index if not exists projects_client_user_id_idx on public.projects(client_user_id);
