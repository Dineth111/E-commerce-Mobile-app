-- ╔══════════════════════════════════════════════════════════════════╗
-- ║                  CREATE PROMOTIONS TABLE                         ║
-- ║  Run this in your Supabase SQL Editor to resolve the error.      ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- 1. Create promotions table if it does not exist
CREATE TABLE IF NOT EXISTS promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value NUMERIC NOT NULL,
  max_uses INTEGER DEFAULT 100,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Disable Row Level Security (RLS) for local development
ALTER TABLE promotions DISABLE ROW LEVEL SECURITY;

-- 3. Grant full permissions to anon and authenticated roles
GRANT ALL ON TABLE promotions TO anon;
GRANT ALL ON TABLE promotions TO authenticated;
