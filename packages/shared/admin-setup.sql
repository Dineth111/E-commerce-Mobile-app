-- ============================================================
-- ADMIN SETUP SQL — Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Create profiles table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  style_quiz JSONB DEFAULT '{}',
  is_banned BOOLEAN DEFAULT false,
  role TEXT DEFAULT 'customer',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add role column if profiles already exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

-- 3. Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  items JSONB DEFAULT '[]',
  total NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  address JSONB DEFAULT '{}',
  promo_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create promotions table
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

-- 5. Create ai_settings table
CREATE TABLE IF NOT EXISTS ai_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  system_prompt TEXT DEFAULT '',
  features JSONB DEFAULT '{"chat": true, "visual_search": true, "recommendations": true, "size_advisor": true}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default AI settings row
INSERT INTO ai_settings (system_prompt, features)
VALUES (
  'You are a helpful fashion assistant.',
  '{"chat": true, "visual_search": true, "recommendations": true, "size_advisor": true}'
) ON CONFLICT DO NOTHING;

-- 6. Add is_active column to products if missing
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS colors TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock JSONB DEFAULT '{}';

-- 7. Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies

-- Profiles: anyone can read, only self or admin can update
CREATE POLICY "profiles_read" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_self" ON profiles FOR UPDATE USING (
  auth.uid() = id OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Orders: users see own, admin sees all
CREATE POLICY "orders_read" ON orders FOR SELECT USING (
  auth.uid() = user_id OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "orders_update_admin" ON orders FOR UPDATE USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Promotions: anyone can read, admin can write
CREATE POLICY "promotions_read" ON promotions FOR SELECT USING (true);
CREATE POLICY "promotions_write" ON promotions FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- AI Settings: anyone can read, admin can write
CREATE POLICY "ai_settings_read" ON ai_settings FOR SELECT USING (true);
CREATE POLICY "ai_settings_write" ON ai_settings FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- 9. Enable Realtime on orders
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- 10. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'customer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- IMPORTANT: After running this script:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add User" → email: admin@app.com, password: admin123
-- 3. Copy the UUID of that new user
-- 4. Run: UPDATE profiles SET role = 'admin' WHERE id = '<paste-uuid-here>';
-- ============================================================
