-- ╔══════════════════════════════════════════════════════════════════╗
-- ║               ADD PRODUCT LINKS TO PROMOTIONS                    ║
-- ║  Run this in your Supabase SQL Editor to support linking deal    ║
-- ║  promotions directly to products in the store.                   ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- 1. Add title and description columns
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '';
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- 2. Add product_id column linking to products table
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;
