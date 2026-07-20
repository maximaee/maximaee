import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// read .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        env[match[1].trim()] = match[2].trim();
    }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addColumn() {
  // we can use supabase REST api directly to send a query if there is an rpc
  // Or just try to see what's wrong by fetching one row
  const { data, error } = await supabase.from('sessions').select('*').limit(1);
  console.log("Current columns in sessions table:", data && data.length > 0 ? Object.keys(data[0]) : "no data");
}

addColumn();
