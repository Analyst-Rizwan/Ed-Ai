-- ============================================================
-- Migration 006: Add GitHub OAuth columns
-- Adds github_access_token and github_username to users table
-- for the 1-click GitHub deployment feature.
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS github_access_token VARCHAR NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_username VARCHAR NULL;
