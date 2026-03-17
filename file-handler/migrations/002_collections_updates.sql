-- 002_collections_updates.sql
-- Run this before starting the collections migration
-- These changes are required for the collections PostgreSQL endpoints to work

-- Add UNIQUE constraint to collections.slug
-- (prevents duplicate collection slugs per the continuation prompt requirement)
ALTER TABLE collections ADD CONSTRAINT collections_slug_unique UNIQUE (slug);

-- Add collection_id to song_links so collections can have song links too
ALTER TABLE song_links ADD COLUMN collection_id UUID REFERENCES collections(id) ON DELETE CASCADE;

-- Make release_id nullable (a song link now belongs to EITHER a release OR a collection)
ALTER TABLE song_links ALTER COLUMN release_id DROP NOT NULL;
