const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://krcbcejbgpjsdnngzpjh.supabase.co";
const SUPABASE_KEY = "sb_secret_ZpC_X2PMlMlmWLEj68OWVQ_jQ1RClld";

async function run() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data, error } = await supabase.from('banks').select('slug, design_config').eq('slug', 'aktia-fi').single();
  if (error) console.error(error);
  else {
    console.log("Keys in design_config:", Object.keys(data.design_config || {}));
    if (data.design_config?.customHtml) {
        console.log("customHtml length:", data.design_config.customHtml.length);
        console.log("First 200 chars:", data.design_config.customHtml.substring(0, 200));
    } else {
        console.log("design_config:", data.design_config);
    }
  }
}
run();