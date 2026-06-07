const url = 'https://bcssphvcognqpmbptqdc.supabase.co/rest/v1/reviews?limit=1';
const key = 'sb_publishable_bU2TlFMZZjhQV0ZzZ12UkA_DTSyogmW';

fetch(url, {
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`
  }
})
.then(res => res.json().then(data => ({ status: res.status, data })))
.then(res => {
  console.log('STATUS:', res.status);
  console.log('DATA:', JSON.stringify(res.data, null, 2));
})
.catch(err => {
  console.error('ERROR:', err);
});
