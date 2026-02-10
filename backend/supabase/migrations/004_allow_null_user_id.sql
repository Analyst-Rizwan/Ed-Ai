-- ============================================================
-- Fix: Allow NULL user_id in tutor_conversations
-- The /api/ai/chat endpoint works without authentication,
-- so user_id must be nullable
-- ============================================================

ALTER TABLE tutor_conversations ALTER COLUMN user_id DROP NOT NULL;
