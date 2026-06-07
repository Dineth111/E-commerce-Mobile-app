-- ╔══════════════════════════════════════════════════════════════════╗
-- ║           UPDATE PROFILE TRIGGER FUNCTION FOR REAL AUTH          ║
-- ║  Run this in your Supabase SQL Editor to automatically sync       ║
-- ║  new user details from signUp authentication to public.profiles. ║
-- ╚══════════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
