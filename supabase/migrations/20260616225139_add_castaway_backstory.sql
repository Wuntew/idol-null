-- Castaway backstory fields: bio details + audition tape, generated once at creation.
-- Never updated by the day-tick simulation; mirrors the index.html prototype's dossier feature.

alter table public.castaways
  add column if not exists age integer,
  add column if not exists hometown text,
  add column if not exists job text,
  add column if not exists education text,
  add column if not exists family text,
  add column if not exists audition_tape text;
