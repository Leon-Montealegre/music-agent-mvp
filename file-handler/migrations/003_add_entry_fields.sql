-- 003_add_entry_fields.sql
-- Adds columns needed for per-entry pages (label/promo detail pages)
-- Run this in Railway PostgreSQL console before deploying the per-entry migration

-- Missing fields on distribution_entries
ALTER TABLE distribution_entries ADD COLUMN IF NOT EXISTS entry_notes  TEXT;
ALTER TABLE distribution_entries ADD COLUMN IF NOT EXISTS signed_date  DATE;

-- Missing fields on contacts (currently only has: id, user_id, name, email, role)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS phone         TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS location      TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS label_name    TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS contact_notes TEXT;
