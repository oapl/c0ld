-- Run this once in the Supabase SQL editor (or via supabase db push).
-- Creates the table that stores every leaderboard snapshot fetched by ingest.js.

CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id           BIGSERIAL    PRIMARY KEY,
  fetched_at   TIMESTAMPTZ  NOT NULL,
  rank         INTEGER      NOT NULL,
  username     TEXT         NOT NULL,
  total_points BIGINT       NOT NULL
);

-- Index used by the 60-min gain query and the cleanup DELETE.
CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_fetched_at
  ON leaderboard_snapshots (fetched_at DESC);
