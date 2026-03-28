-- 008_add_email_notifications.sql
-- Adds two columns to users so we can suppress reminder emails cleanly:
--
--   email_notifications_enabled
--     TRUE by default. Set to FALSE when:
--       - a user deletes their own account (self-service)
--       - an admin deletes a user (handled in admin route as a safety net)
--       - a user clicks the unsubscribe link in any email
--     The daily cron filters out users where this is FALSE, so even if
--     distribution_entries data lingers, no email is ever sent.
--
--   unsubscribe_token
--     A random UUID generated once per user. Used in the one-click
--     unsubscribe link embedded in every reminder email.
--     No login required to use it — hitting GET /unsubscribe?token=<this>
--     sets email_notifications_enabled = FALSE for that user.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid();

-- Make the token unique so we can look it up safely
CREATE UNIQUE INDEX IF NOT EXISTS users_unsubscribe_token_idx ON users (unsubscribe_token);
