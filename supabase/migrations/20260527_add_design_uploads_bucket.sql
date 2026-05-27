-- Storage bucket für hochgeladene Design-Dateien (HTML, ZIP, etc.)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'design-uploads',
  'design-uploads',
  true,
  52428800, -- 50 MB
  array[
    'text/html',
    'application/zip',
    'application/x-zip-compressed',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/pdf'
  ]
)
on conflict (id) do nothing;

-- Eingeloggte Nutzer dürfen in ihren eigenen Ordner hochladen
create policy "design-uploads: authenticated upload"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'design-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Jeder darf Dateien lesen (public bucket für Kunden-Pitch)
create policy "design-uploads: public read"
  on storage.objects
  for select
  using (bucket_id = 'design-uploads');

-- Nutzer dürfen eigene Dateien löschen
create policy "design-uploads: owner delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'design-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
