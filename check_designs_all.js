const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://krcbcejbgpjsdnngzpjh.supabase.co";
const SUPABASE_KEY = "sb_secret_ZpC_X2PMlMlmWLEj68OWVQ_jQ1RClld";

async function run() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data, error } = await supabase.from('banks').select('slug, country, design_config').in('country', ['İspanya', 'Finlandiya', 'ES', 'FI']);
  if (error) console.error(error);
  else {
    for (const bank of data) {
        const hasDesign = bank.design_config && Object.keys(bank.design_config).length > 0;
        console.log(`Bank: ${bank.slug}, hasDesign: ${hasDesign}`);
    }
  }
}
run();