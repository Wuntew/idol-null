CREATE TABLE IF NOT EXISTS map_events (
  id SERIAL PRIMARY KEY,
  season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  day INTEGER NOT NULL,
  ev_type INTEGER NOT NULL,
  tile_x INTEGER NOT NULL,
  tile_y INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS map_events_season_day ON map_events(season_id, day);
