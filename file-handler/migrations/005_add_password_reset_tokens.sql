-- Migration 005: Password reset tokens table
-- Run this in Railway's PostgreSQL query editor before deploying.
--
-- Each row is a one-time-use reset token.
--   token      — a 64-char random hex string, sent to the user in an email link
--   expires_at — 1 hour after creation; the backend rejects expired tokens
--   used_at    — set when the token is consumed; prevents reuse

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         SERIAL      PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT        NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index so we can look up a token quickly
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
