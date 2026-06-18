
CREATE TABLE challenges (
  id          serial PRIMARY KEY,
  season_id   integer NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  label       text    NOT NULL,
  x           integer NOT NULL CHECK (x >= 0 AND x < 136),
  y           integer NOT NULL CHECK (y >= 0 AND y < 68),
  day         integer,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX challenges_season_idx ON challenges (season_id);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "challenges_public_read" ON challenges
  FOR SELECT USING (true);

CREATE POLICY "challenges_service_write" ON challenges
  FOR ALL USING (auth.role() = 'service_role');
