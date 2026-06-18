
ALTER TABLE seasons
  ADD COLUMN seed integer NOT NULL DEFAULT floor(random() * 2147483647)::integer;

UPDATE seasons SET seed = 1337 WHERE season_number = 1;
