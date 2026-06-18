
-- Tribes table
CREATE TABLE IF NOT EXISTS tribes (
  id SERIAL PRIMARY KEY,
  season_id INTEGER REFERENCES seasons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,         -- hex, e.g. '#cc4400'
  camp_x INTEGER NOT NULL,     -- map tile X (0–135)
  camp_y INTEGER NOT NULL,     -- map tile Y (0–67)
  is_merge_tribe BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tribes_season_idx ON tribes(season_id);

-- Add tribe_id to castaways (nullable so existing rows don't break)
ALTER TABLE castaways ADD COLUMN IF NOT EXISTS tribe_id INTEGER REFERENCES tribes(id) ON DELETE SET NULL;

-- Tribe resources — one row per tribe per day
CREATE TABLE IF NOT EXISTS tribe_resources (
  id SERIAL PRIMARY KEY,
  tribe_id INTEGER NOT NULL REFERENCES tribes(id) ON DELETE CASCADE,
  season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  day INTEGER NOT NULL,
  food INTEGER NOT NULL DEFAULT 50 CHECK (food BETWEEN 0 AND 100),
  hydration INTEGER NOT NULL DEFAULT 50 CHECK (hydration BETWEEN 0 AND 100),
  shelter_level INTEGER NOT NULL DEFAULT 1 CHECK (shelter_level BETWEEN 0 AND 5),
  fire_level INTEGER NOT NULL DEFAULT 1 CHECK (fire_level BETWEEN 0 AND 5),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tribe_id, day)
);

CREATE INDEX IF NOT EXISTS tribe_resources_tribe_day_idx ON tribe_resources(tribe_id, day);

-- Enable RLS (read-only public access)
ALTER TABLE tribes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribe_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read tribes" ON tribes FOR SELECT USING (true);
CREATE POLICY "Public read tribe_resources" ON tribe_resources FOR SELECT USING (true);
