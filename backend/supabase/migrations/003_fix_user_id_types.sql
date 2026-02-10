-- ============================================================
-- DEFINITIVE FIX: Drop ALL RLS, fix user_id types, recreate FKs
-- Run this ENTIRE script in one go in Supabase SQL Editor
-- ============================================================

-- STEP 1: Drop EVERY RLS policy in the public schema
DROP POLICY IF EXISTS "Users can insert own syncs" ON leetcode_syncs;
DROP POLICY IF EXISTS "Users can update own syncs" ON leetcode_syncs;
DROP POLICY IF EXISTS "Users can view own syncs" ON leetcode_syncs;
DROP POLICY IF EXISTS "Only admins can insert problems" ON problems;
DROP POLICY IF EXISTS "Only admins can update problems" ON problems;
DROP POLICY IF EXISTS "Problems are viewable by everyone" ON problems;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own progress" ON progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON progress;
DROP POLICY IF EXISTS "Users can update own progress" ON progress;
DROP POLICY IF EXISTS "Users can view own progress" ON progress;
DROP POLICY IF EXISTS "Only admins can insert roadmaps" ON roadmaps;
DROP POLICY IF EXISTS "Only admins can update roadmaps" ON roadmaps;
DROP POLICY IF EXISTS "Roadmaps are viewable by everyone" ON roadmaps;
DROP POLICY IF EXISTS "Users can delete own conversations" ON tutor_conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON tutor_conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON tutor_conversations;
DROP POLICY IF EXISTS "Users can view own conversations" ON tutor_conversations;
DROP POLICY IF EXISTS "Users can insert messages in own conversations" ON tutor_messages;
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON tutor_messages;
DROP POLICY IF EXISTS "Users can insert own user_progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update own user_progress" ON user_progress;
DROP POLICY IF EXISTS "Users can view own user_progress" ON user_progress;

-- STEP 2: Disable RLS on ALL tables
ALTER TABLE leetcode_syncs DISABLE ROW LEVEL SECURITY;
ALTER TABLE problems DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE roadmaps DISABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress DISABLE ROW LEVEL SECURITY;

-- STEP 3: Drop foreign key constraints on affected tables
ALTER TABLE progress DROP CONSTRAINT IF EXISTS progress_user_id_fkey;
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_user_id_fkey;
ALTER TABLE leetcode_syncs DROP CONSTRAINT IF EXISTS leetcode_syncs_user_id_fkey;
ALTER TABLE tutor_conversations DROP CONSTRAINT IF EXISTS tutor_conversations_user_id_fkey;

-- STEP 4: Alter column types (all 0 rows, safe)
ALTER TABLE progress ALTER COLUMN user_id TYPE INTEGER USING NULL;
ALTER TABLE user_progress ALTER COLUMN user_id TYPE INTEGER USING NULL;
ALTER TABLE leetcode_syncs ALTER COLUMN user_id TYPE INTEGER USING NULL;
ALTER TABLE tutor_conversations ALTER COLUMN user_id TYPE INTEGER USING NULL;

-- STEP 5: Recreate foreign keys to public.users(id)
ALTER TABLE progress ADD CONSTRAINT progress_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE user_progress ADD CONSTRAINT user_progress_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE leetcode_syncs ADD CONSTRAINT leetcode_syncs_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE tutor_conversations ADD CONSTRAINT tutor_conversations_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
