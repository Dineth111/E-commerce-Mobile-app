-- ╔══════════════════════════════════════════════════════════════════╗
-- ║               FIX PROFILES TABLE FOR USER CREATION               ║
-- ║  Run this in your Supabase SQL Editor to allow the admin app to  ║
-- ║  successfully insert mock users.                                 ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- 1. Add missing 'phone' column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;

-- 2. Make the primary key ID auto-generate a random UUID if not provided
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Drop the strict foreign key link to auth.users for local dev.
-- This allows the admin app to insert new mock users directly into the profiles table
-- without needing a prior entry in Supabase Auth's private tables.
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
