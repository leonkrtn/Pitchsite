-- Pitch-Passwortschutz: Freelancer kann einen Zugangscode für den Kunden setzen.
-- pitch_password_changed = false → Erstzugang (Kunde muss Passwort ändern)
-- pitch_password_changed = true  → Kunde hat eigenes Passwort gesetzt

alter table public.projects
  add column if not exists pitch_password         text,
  add column if not exists pitch_password_changed boolean default false;
