-- Neuer Projektstatus: Designer hat geliefert, Abnahme durch Auftraggeber ausstehend
-- Falls eine CHECK-Constraint auf der status-Spalte existiert, muss sie aktualisiert werden.

alter table public.projects
  drop constraint if exists projects_status_check;

alter table public.projects
  add constraint projects_status_check
  check (status in ('offen', 'ausstehend', 'escrow', 'abgeliefert', 'abgeschlossen'));
