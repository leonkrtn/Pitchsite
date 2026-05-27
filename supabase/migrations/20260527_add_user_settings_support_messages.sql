-- user_settings: Speichert Benachrichtigungs-Präferenzen pro Nutzer
create table if not exists public.user_settings (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  notify_comments boolean not null default true,
  notify_payments boolean not null default true,
  notify_weekly   boolean not null default false,
  updated_at      timestamptz not null default now(),
  unique (user_id)
);

alter table public.user_settings enable row level security;

create policy "user_settings: own rows only"
  on public.user_settings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Automatisch updated_at aktualisieren
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_settings_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();


-- support_messages: Speichert Kontaktanfragen aus der Hilfe-Seite
create table if not exists public.support_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete set null,
  name       text not null,
  email      text not null,
  subject    text not null,
  message    text not null,
  created_at timestamptz not null default now()
);

alter table public.support_messages enable row level security;

-- Eingeloggte Nutzer dürfen eigene Nachrichten einreichen
create policy "support_messages: insert own"
  on public.support_messages
  for insert
  with check (auth.uid() = user_id or user_id is null);

-- Nur der Service-Role (Admin) darf lesen
create policy "support_messages: service role read"
  on public.support_messages
  for select
  using (auth.role() = 'service_role');
