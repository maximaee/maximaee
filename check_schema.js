const { Client } = require('pg');

const connectionString = 'postgresql://postgres.krcbcejbgpjsdnngzpjh:Albertheijndemo123@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';

async function check() {
  const client = new Client({ connectionString });
  await client.connect();
  
  try {
    const res = await client.query("SELECT data_type, column_default FROM information_schema.columns WHERE table_name = 'global_settings' AND column_name = 'id'");
    console.log('Current ID schema:', res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

check();
