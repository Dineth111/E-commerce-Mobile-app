-- ╔══════════════════════════════════════════════════════════════════╗
-- ║               RESOLVE RLS ON REVIEWS TABLE                       ║
-- ║  Run this in your Supabase SQL Editor to enable public access    ║
-- ║  and resolve the 403 / 401 Forbidden errors.                    ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- 1. Drop existing policies to prevent any conflicts
DROP POLICY IF EXISTS "Allow public read access" ON reviews;
DROP POLICY IF EXISTS "Allow public insert access" ON reviews;
DROP POLICY IF EXISTS "Allow public update access" ON reviews;
DROP POLICY IF EXISTS "Allow public delete access" ON reviews;

-- 2. Grant full permissions to anon, authenticated, and service_role
GRANT ALL ON TABLE reviews TO anon;
GRANT ALL ON TABLE reviews TO authenticated;
GRANT ALL ON TABLE reviews TO service_role;

-- 3. Enable RLS and create wide-open policies so that both RLS-enabled
--    and RLS-disabled modes allow full access without errors.
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON reviews FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON reviews FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete access" ON reviews FOR DELETE USING (true);
