-- Extend project_annotations to support element-anchored inspector annotations.
-- Adds a 'selector' column (CSS path to the element) and 'meta' column (tag, classes,
-- size, colour) for display. Widens the kind check to include 'element'.
alter table public.project_annotations
  add column if not exists selector text,
  add column if not exists meta    jsonb;

alter table public.project_annotations
  drop constraint if exists project_annotations_kind_check;
alter table public.project_annotations
  add constraint project_annotations_kind_check
  check (kind in ('pin', 'box', 'draw', 'callout', 'element'));
