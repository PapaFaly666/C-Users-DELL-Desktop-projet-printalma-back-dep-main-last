CREATE TABLE IF NOT EXISTS search_terms (
  id          SERIAL PRIMARY KEY,
  term        VARCHAR(255) NOT NULL UNIQUE,
  click_count INT NOT NULL DEFAULT 1,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS search_terms_click_count_idx ON search_terms(click_count);
