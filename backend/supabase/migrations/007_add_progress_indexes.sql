-- Migration: 007_add_progress_indexes.sql
-- Adds indexes to the progress table to speed up the most common query patterns:
--  1. All progress for a user (e.g., dashboard, solved count)
--  2. Progress for a specific problem (e.g., leaderboard)
--  3. User + problem composite (e.g., "has this user solved this problem?")

-- Most used: fetching all progress rows for a specific user
CREATE INDEX IF NOT EXISTS idx_progress_user_id
    ON progress(user_id);

-- Secondary: individual problem lookups
CREATE INDEX IF NOT EXISTS idx_progress_problem_id
    ON progress(problem_id);

-- Most targeted: the N+1 replacement query now uses this for O(1) lookup
CREATE INDEX IF NOT EXISTS idx_progress_user_problem
    ON progress(user_id, problem_id);
