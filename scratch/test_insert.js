const url = 'https://bcssphvcognqpmbptqdc.supabase.co/rest/v1/reviews';
const key = 'sb_publishable_bU2TlFMZZjhQV0ZzZ12UkA_DTSyogmW';

const payload = {
  product_id: 'd9b736b4-a4b7-4c4f-9e7c-88e404b901a1', // dummy UUID or actual
  user_id: null,
  username: 'Test User',
  avatar: null,
  rating: 5,
  comment: 'Test comment from node script',
  status: 'pending'
};

fetch(url, {
  method: 'POST',
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  },
  body: JSON.stringify(payload)
})
.then(res => res.json().then(data => ({ status: res.status, data })))
.then(res => {
  console.log('STATUS:', res.status);
  console.log('DATA:', JSON.stringify(res.data, null, 2));
})
.catch(err => {
  console.error('ERROR:', err);
});
