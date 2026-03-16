-- 001_initial_schema.sql
-- Initial PostgreSQL schema for music-agent-mvp
-- Run this once to create all tables

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT,                  -- null if Google-only login
  name          TEXT,
  google_id     TEXT,                  -- null if email/password login
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COLLECTIONS (must exist before releases, due to foreign key)
-- ============================================================
CREATE TABLE IF NOT EXISTS collections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug          TEXT NOT NULL,         -- e.g. "2024-03-01_Artist_Title" (used in URLs)
  title         TEXT,
  artist        TEXT,
  genre         TEXT,
  release_type  TEXT,
  release_date  DATE,
  is_signed     BOOLEAN DEFAULT false,
  signed_label  TEXT,
  signed_date   DATE,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RELEASES
-- ============================================================
CREATE TABLE IF NOT EXISTS releases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug            TEXT NOT NULL,       -- e.g. "2024-03-01_Artist_Title" (used in URLs)
  title           TEXT,
  artist          TEXT,
  genre           TEXT,
  bpm             INTEGER,
  key             TEXT,
  track_date      DATE,
  release_date    DATE,
  release_type    TEXT,
  release_format  TEXT,
  collection_id   UUID REFERENCES collections(id) ON DELETE SET NULL,
  is_signed       BOOLEAN DEFAULT false,
  signed_label    TEXT,
  signed_date     DATE,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DISTRIBUTION ENTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS distribution_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id      UUID REFERENCES releases(id) ON DELETE CASCADE,
  collection_id   UUID REFERENCES collections(id) ON DELETE CASCADE,
  path_type       TEXT NOT NULL,       -- "release", "submit", "promote"
  platform        TEXT,
  label           TEXT,
  promo_name      TEXT,
  status          TEXT,                -- "Live", "Pending", "Signed", etc.
  url             TEXT,
  live_date       DATE,
  page_notes      TEXT,
  timestamp       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CONTACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS contacts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT,
  email       TEXT,
  role        TEXT,                    -- "Label", "Promo", "Other"
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ENTRY_CONTACTS (join table: links contacts to distribution entries)
-- ============================================================
CREATE TABLE IF NOT EXISTS entry_contacts (
  contact_id  UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  entry_id    UUID NOT NULL REFERENCES distribution_entries(id) ON DELETE CASCADE,
  PRIMARY KEY (contact_id, entry_id)
);

-- ============================================================
-- FILES
-- ============================================================
CREATE TABLE IF NOT EXISTS files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  release_id      UUID REFERENCES releases(id) ON DELETE CASCADE,
  collection_id   UUID REFERENCES collections(id) ON DELETE CASCADE,
  entry_id        UUID REFERENCES distribution_entries(id) ON DELETE CASCADE,
  category        TEXT,                -- "audio", "video", "artwork", "label", "promo", "notes"
  filename        TEXT,
  r2_key          TEXT,                -- full path in Cloudflare R2 e.g. "users/abc123/releases/xyz/audio/track.wav"
  size_bytes      BIGINT,
  duration        REAL,
  bitrate         INTEGER,
  sample_rate     INTEGER,
  channels        INTEGER,
  codec           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS notes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id      UUID REFERENCES releases(id) ON DELETE CASCADE,
  collection_id   UUID REFERENCES collections(id) ON DELETE CASCADE,
  entry_id        UUID REFERENCES distribution_entries(id) ON DELETE CASCADE,
  text            TEXT,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SONG LINKS
-- ============================================================
CREATE TABLE IF NOT EXISTS song_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id  UUID NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  label       TEXT,
  url         TEXT
);

-- ============================================================
-- SETTINGS (one row per user)
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  user_id        UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  artist_name    TEXT,
  default_genre  TEXT,
  preferences    JSONB
);
