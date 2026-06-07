-- ╔══════════════════════════════════════════════════════════════════╗
-- ║           FIX ADMIN ORDERS VIEW & DATABASE RELATIONSHIPS         ║
-- ║  Run this in your Supabase SQL Editor to let the admin app see   ║
-- ║  the orders and customer profile details without RLS blocking.  ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- 1. Disable Row Level Security (RLS) on orders & profiles for local development.
-- This ensures the mock admin session can select/update orders without 401s.
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- 2. Establish a foreign key constraint from orders -> profiles.
-- Without this, PostgREST cannot resolve `.select('*, profiles(...)')` joins,
-- which causes the query in the Admin App to fail and return empty.
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_customer_id_profiles_fkey;

ALTER TABLE orders 
  ADD CONSTRAINT orders_customer_id_profiles_fkey 
  FOREIGN KEY (customer_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

-- 3. Grant full permissions to anonymous/public users for development
GRANT ALL ON TABLE orders TO anon;
GRANT ALL ON TABLE orders TO authenticated;
GRANT ALL ON TABLE profiles TO anon;
GRANT ALL ON TABLE profiles TO authenticated;
