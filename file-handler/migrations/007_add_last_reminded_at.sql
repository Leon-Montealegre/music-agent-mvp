-- 007_add_last_reminded_at.sql
-- Tracks when a follow-up email was last sent for a label submission
-- so the daily cron doesn't re-send the same reminder multiple times.

ALTER TABLE distribution_entries
  ADD COLUMN IF NOT EXISTS last_reminded_at TIMESTAMPTZ;
