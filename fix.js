const fs = require('fs');
const https = require('https');

const env = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
}

const data = JSON.stringify({ country: 'Hollanda' });

const options = {
  method: 'PATCH',
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  }
};

const req = https.request(`${url}/rest/v1/banks?country=is.null`, options, (res) => {
  console.log('Status null:', res.statusCode);
  const req2 = https.request(`${url}/rest/v1/banks?country=eq.`, options, (res2) => {
    console.log('Status empty:', res2.statusCode);
  });
  req2.write(data);
  req2.end();
});

req.write(data);
req.end();
