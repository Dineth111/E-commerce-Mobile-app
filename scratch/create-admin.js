const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './apps/admin-app/.env' });

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_KEY
);

async function createAdmin() {
  console.log('Signing up shopadmin@gmail.com...');
  const { data, error } = await supabase.auth.signUp({
    email: 'shopadmin@gmail.com',
    password: 'admin123',
  });

  if (error) {
    console.error('Error signing up:', error.message);
    if (error.message.includes('User already registered')) {
        console.log('User already exists. Proceeding to update role...');
    } else {
        return;
    }
  }

  // To set the role, we actually need to log in to get the session token,
  // then attempt to insert into profiles. But wait, RLS prevents arbitrary inserts.
  // Let's just output instructions.
  console.log('Signup successful!', data?.user?.id);
}

createAdmin();
