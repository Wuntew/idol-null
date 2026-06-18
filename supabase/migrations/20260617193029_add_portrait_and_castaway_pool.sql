
-- Add portrait_file to castaways
ALTER TABLE castaways ADD COLUMN IF NOT EXISTS portrait_file text;

-- Castaway pool: season-agnostic profiles ready for future seasons
CREATE TABLE IF NOT EXISTS castaway_pool (
  id            serial PRIMARY KEY,
  portrait_file text NOT NULL UNIQUE,
  name          text NOT NULL,
  archetype     text NOT NULL,
  trait         text NOT NULL,
  stats         jsonb NOT NULL DEFAULT '{}',
  seed          integer NOT NULL,
  age           integer,
  hometown      text,
  job           text,
  education     text,
  family        text,
  audition_tape text,
  used_in_season integer REFERENCES seasons(id),
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE castaway_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read castaway_pool" ON castaway_pool FOR SELECT USING (true);
