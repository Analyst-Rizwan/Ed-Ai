-- Migration: Add 'topic' column to 'tutor_conversations'
-- This script is for PostgreSQL (Render/Supabase)

ALTER TABLE tutor_conversations ADD COLUMN IF NOT EXISTS topic VARCHAR;

-- Also ensuring other tutor tables exist with correct columns if create_all missed them
CREATE TABLE IF NOT EXISTS tutor_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES tutor_conversations(id) ON DELETE CASCADE,
    role VARCHAR NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tutor_roadmaps (
    id SERIAL PRIMARY KEY,
    title VARCHAR NOT NULL,
    topic VARCHAR,
    content TEXT,
    ordering INTEGER DEFAULT 0
);
