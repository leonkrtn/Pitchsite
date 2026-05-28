-- Erlaubt anonymen (nicht eingeloggten) Nutzern, Projekte per Code nachzuschlagen.
-- Wird benötigt damit die Join-Seite den Code validieren kann, bevor sich der
-- Kunde einloggt. Die Spalten pitch_password und pitch_password_changed sind
-- unkritisch: ohne den Code selbst kommt man ohnehin nicht an den Pitch.

-- Nur falls RLS noch nicht aktiv ist (schadet nicht wenn schon aktiv):
alter table public.projects enable row level security;

-- Anonyme Nutzer dürfen Projekte lesen (Basis für Code-Lookup und Pitch-Viewer)
create policy "projects: public read"
  on public.projects
  for select
  to anon
  using (true);

-- Eingeloggte Nutzer dürfen ebenfalls alle Projekte lesen
-- (wird für dashboard, pitch-viewer und client-seite benötigt)
create policy "projects: authenticated read"
  on public.projects
  for select
  to authenticated
  using (true);

-- Nur der Designer (Ersteller) darf sein Projekt anlegen, ändern und löschen
create policy "projects: owner insert"
  on public.projects
  for insert
  to authenticated
  with check (designer_id = auth.uid());

create policy "projects: owner update"
  on public.projects
  for update
  to authenticated
  using (designer_id = auth.uid() or client_user_id = auth.uid());

create policy "projects: owner delete"
  on public.projects
  for delete
  to authenticated
  using (designer_id = auth.uid());
