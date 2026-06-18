
ALTER TABLE challenges ADD COLUMN sort_order integer NOT NULL DEFAULT 0;

CREATE INDEX challenges_label_order_idx ON challenges (season_id, label, sort_order);
