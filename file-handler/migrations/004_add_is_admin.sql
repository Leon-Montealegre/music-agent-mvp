-- Migration 004: add is_admin flag to users
-- Run once against your database to enable the admin panel.
-- Usage:  psql $DATABASE_URL -f migrations/004_add_is_admin.sql

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- To promote a user to admin, run:
--   UPDATE users SET is_admin = true WHERE email = 'your@email.com';
