const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bcssphvcognqpmbptqdc.supabase.co';
const supabaseKey = 'sb_publishable_bU2TlFMZZjhQV0ZzZ12UkA_DTSyogmW';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

async function runTest() {
  console.log('1. Subscribing to promotions table INSERT channel...');
  
  let eventReceived = false;
  
  const channel = supabase
    .channel('test-channel')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'promotions' },
      (payload) => {
        console.log('🎉 SUCCESS: Realtime event received!', payload);
        eventReceived = true;
      }
    )
    .subscribe((status) => {
      console.log('Channel status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('2. Channel subscribed successfully. Inserting test promotion...');
        
        const testCode = 'TEST' + Math.floor(Math.random() * 10000);
        supabase.from('promotions').insert([
          {
            code: testCode,
            type: 'percentage',
            value: 15,
            title: 'Test Promo',
            description: 'This is a test realtime promotion',
            expires_at: new Date(Date.now() + 86400000).toISOString(),
            is_active: true
          }
        ]).then(({ data, error }) => {
          if (error) {
            console.error('Error inserting promo:', error);
          } else {
            console.log(`Promo ${testCode} inserted successfully! Waiting for event...`);
          }
        });
      }
    });

  // Wait 6 seconds for the event, then clean up
  setTimeout(() => {
    supabase.removeChannel(channel);
    if (!eventReceived) {
      console.log('❌ FAILED: Realtime event was NOT received within 6 seconds. This indicates that Realtime replication is NOT enabled for the promotions table in Supabase.');
    }
    process.exit(0);
  }, 6000);
}

runTest();
