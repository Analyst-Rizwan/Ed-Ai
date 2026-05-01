-- ============================================================
-- EdAI Production Migration Script
-- Run this in Supabase SQL Editor BEFORE deploying the new code
-- ============================================================

-- 1. Create playground_settings table (if missing)
CREATE TABLE IF NOT EXISTS playground_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    layout_mode VARCHAR DEFAULT 'stacked',
    editor_panel_size INTEGER DEFAULT 62,
    output_panel_size INTEGER DEFAULT 38,
    font_size INTEGER DEFAULT 14,
    font_family VARCHAR DEFAULT 'JetBrains Mono',
    tab_size INTEGER DEFAULT 4,
    show_minimap BOOLEAN DEFAULT FALSE,
    show_line_numbers BOOLEAN DEFAULT TRUE,
    word_wrap VARCHAR DEFAULT 'off',
    show_whitespace VARCHAR DEFAULT 'selection',
    last_language_id INTEGER DEFAULT 71,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_playground_settings_user_id
    ON playground_settings(user_id);


-- 2. Ensure progress.solved column exists (the model uses "solved", not "completed")
-- This is a safety check — if the column already exists, this is a no-op
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'progress' AND column_name = 'solved'
    ) THEN
        ALTER TABLE progress ADD COLUMN solved BOOLEAN DEFAULT FALSE;
    END IF;
END $$;


-- 3. Add index on tutor_conversations.user_id (conversations list was 14s without this)
CREATE INDEX IF NOT EXISTS idx_tutor_conversations_user_id
    ON tutor_conversations(user_id);

-- 4. Add index on tutor_messages.conversation_id (message count subquery)
CREATE INDEX IF NOT EXISTS idx_tutor_messages_conversation_id
    ON tutor_messages(conversation_id);

-- 5. Add index on conversations table if it exists (AI conversations)
-- The model uses "tutor_conversations" table name
CREATE INDEX IF NOT EXISTS idx_tutor_messages_role
    ON tutor_messages(conversation_id, role, created_at);


-- 6. Verify — run these after the above to confirm everything works:
-- SELECT COUNT(*) FROM playground_settings;
-- SELECT solved FROM progress LIMIT 1;
-- SELECT COUNT(*) FROM tutor_conversations;
