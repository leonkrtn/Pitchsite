-- Zeitstempel wenn Designer das Projekt als abgeliefert markiert
alter table public.projects
  add column if not exists delivered_at timestamptz default null;
