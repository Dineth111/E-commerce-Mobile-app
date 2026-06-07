-- ╔══════════════════════════════════════════════════════════════════╗
-- ║               DISABLE RLS ON PROMOTIONS TABLE                    ║
-- ║  Run this in your Supabase SQL Editor to resolve the RLS error.  ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- 1. Drop existing policies to prevent any conflicts
DROP POLICY IF EXISTS promotions_write ON promotions;
DROP POLICY IF EXISTS promotions_read ON promotions;
DROP POLICY IF EXISTS promotions_all ON promotions;

-- 2. Force RLS to be disabled
ALTER TABLE promotions DISABLE ROW LEVEL SECURITY;

-- 3. Grant full permissions to anonymous/public users
GRANT ALL ON TABLE promotions TO anon;
GRANT ALL ON TABLE promotions TO authenticated;
GRANT ALL ON TABLE promotions TO service_role;
