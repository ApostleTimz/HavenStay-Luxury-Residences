-- Stable keys let the backend safely keep demo listings bookable across restarts.
ALTER TABLE apartments
  ADD COLUMN IF NOT EXISTS seed_key VARCHAR(100);

CREATE UNIQUE INDEX IF NOT EXISTS apartments_seed_key_unique
  ON apartments (seed_key);
