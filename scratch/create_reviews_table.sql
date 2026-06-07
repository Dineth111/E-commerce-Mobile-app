-- ╔══════════════════════════════════════════════════════════════════╗
-- ║                     CREATE REVIEWS TABLE                         ║
-- ║  Run this in your Supabase SQL Editor to support user reviews    ║
-- ║  and admin moderation.                                           ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- 1. Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID, -- References auth.users(id) if needed, but not strictly foreign-keyed to avoid RLS auth complications
  username TEXT NOT NULL,
  avatar TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  helpful INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Disable Row Level Security (RLS) for local development
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

-- 3. Grant full permissions to anon and authenticated roles
GRANT ALL ON TABLE reviews TO anon;
GRANT ALL ON TABLE reviews TO authenticated;

-- 4. Enable Supabase Realtime replication for reviews table
ALTER PUBLICATION supabase_realtime ADD TABLE reviews;
