const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/admin-app/.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_KEY;

console.log('SUPABASE_URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
  try {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (error) {
      console.error('Error fetching profiles:', error);
      return;
    }
    console.log('Sample profiles row:', data);
    if (data && data.length > 0) {
      console.log('Available columns in profiles:', Object.keys(data[0]));
    } else {
      console.log('No profiles rows found, but query succeeded.');
      // Let's try to query table structure via postgrest if possible, or just insert a dummy and see.
    }
  } catch (err) {
    console.error('Inspection failed:', err);
  }
}

inspectSchema();
