-- ============================================================
-- EduAI PostgreSQL Schema for Supabase
-- ============================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR NOT NULL UNIQUE,
    username VARCHAR NOT NULL UNIQUE,
    full_name VARCHAR,
    is_active BOOLEAN DEFAULT TRUE,
    is_superuser BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);
CREATE INDEX IF NOT EXISTS ix_users_username ON users(username);

-- Problems table  
CREATE TABLE IF NOT EXISTS problems (
    id SERIAL PRIMARY KEY,
    title VARCHAR NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR NOT NULL,
    category VARCHAR,
    leetcode_slug VARCHAR UNIQUE,
    acceptance FLOAT DEFAULT 0.0,
    likes INTEGER DEFAULT 0,
    tags JSONB DEFAULT '[]',
    hints JSONB DEFAULT '[]',
    starter_code TEXT,
    test_cases JSONB DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS ix_problems_leetcode_slug ON problems(leetcode_slug);

-- Roadmaps table
CREATE TABLE IF NOT EXISTS roadmaps (
    id SERIAL PRIMARY KEY,
    title VARCHAR NOT NULL,
    description TEXT,
    steps TEXT
);

-- User progress (aggregated)
CREATE TABLE IF NOT EXISTS user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    completed_roadmaps JSONB DEFAULT '[]',
    completed_problems JSONB DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS ix_user_progress_user_id ON user_progress(user_id);

-- Per-problem progress
CREATE TABLE IF NOT EXISTS progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    solved BOOLEAN DEFAULT FALSE,
    attempted BOOLEAN DEFAULT FALSE,
    last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    solution_code TEXT,
    notes TEXT,
    time_spent INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ix_progress_user_id ON progress(user_id);
CREATE INDEX IF NOT EXISTS ix_progress_problem_id ON progress(problem_id);

-- LeetCode sync history
CREATE TABLE IF NOT EXISTS leetcode_syncs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sync_status VARCHAR DEFAULT 'pending',
    problems_synced INTEGER DEFAULT 0,
    sync_started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_completed_at TIMESTAMP,
    error_message VARCHAR,
    sync_data JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS ix_leetcode_syncs_user_id ON leetcode_syncs(user_id);
