import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addColumn() {
  const { error } = await supabase.rpc('run_sql', { sql: "ALTER TABLE banks ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;" });
  
  if (error) {
    console.log("RPC run_sql failed, trying direct insert/select to check if column exists...");
    const { data, error: selectError } = await supabase.from('banks').select('is_active').limit(1);
    if (selectError && selectError.message.includes("does not exist")) {
        console.error("Column 'is_active' does not exist and no direct SQL method available.");
        console.error("Please add the column 'is_active' (boolean, default true) to the 'banks' table in Supabase Dashboard.");
    } else {
        console.log("Column 'is_active' might already exist or checking failed:", selectError?.message || "exists");
    }
  } else {
    console.log("Added column via RPC successfully!");
  }
}

addColumn();
