-- ============================================================
-- Migration 005: Sync SQLite Schema
-- Add missing columns and tables to match the local SQLite DB
-- ============================================================

-- 1. Add missing columns to 'users' table
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS supabase_id VARCHAR UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_streak_update TIMESTAMP;

CREATE INDEX IF NOT EXISTS ix_users_supabase_id ON users(supabase_id);

-- 2. Add missing columns to 'roadmaps' table
ALTER TABLE roadmaps ADD COLUMN IF NOT EXISTS level VARCHAR;
ALTER TABLE roadmaps ADD COLUMN IF NOT EXISTS duration_weeks INTEGER;
ALTER TABLE roadmaps ADD COLUMN IF NOT EXISTS roadmap_json TEXT;

-- 3. Create 'refresh_tokens' table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS ix_refresh_tokens_user_id ON refresh_tokens(user_id);

-- 4. Create 'user_roadmaps' table
CREATE TABLE IF NOT EXISTS user_roadmaps (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    roadmap_id INTEGER NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
    status VARCHAR DEFAULT 'active',
    progress INTEGER DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_user_roadmaps_user_id ON user_roadmaps(user_id);
CREATE INDEX IF NOT EXISTS ix_user_roadmaps_roadmap_id ON user_roadmaps(roadmap_id);

-- 5. Create 'user_roadmap_progress' table
CREATE TABLE IF NOT EXISTS user_roadmap_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    roadmap_id INTEGER NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
    status VARCHAR DEFAULT 'active',
    progress_percentage INTEGER DEFAULT 0,
    current_week INTEGER DEFAULT 1,
    current_day INTEGER DEFAULT 1,
    completed_items TEXT DEFAULT '[]',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    earned_xp INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ix_user_roadmap_progress_user_id ON user_roadmap_progress(user_id);
CREATE INDEX IF NOT EXISTS ix_user_roadmap_progress_roadmap_id ON user_roadmap_progress(roadmap_id);
