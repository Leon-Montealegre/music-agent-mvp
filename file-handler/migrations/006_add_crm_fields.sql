-- 006_add_crm_fields.sql
-- Adds Phase 3 CRM fields to distribution_entries
-- Run this in Railway's PostgreSQL query editor before deploying CRM features

-- follow_up_date: optional date to remind you to follow up on a submission
-- e.g. "check back with Anjuna on 2026-04-01"
ALTER TABLE distribution_entries ADD COLUMN IF NOT EXISTS follow_up_date DATE;

-- response_status: what the label/promo outlet said back
-- Values: 'No Reply', 'Interested', 'Passed', 'Signed'
-- Defaults to 'No Reply' so existing entries are automatically categorised
ALTER TABLE distribution_entries ADD COLUMN IF NOT EXISTS response_status TEXT NOT NULL DEFAULT 'No Reply';
