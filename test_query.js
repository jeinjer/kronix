import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from whatsapp-bot or root
dotenv.config({ path: path.resolve('C:\\Users\\Stefano\\Downloads\\kronix\\kronix\\whatsapp-bot\\.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials in env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('organizations').select('*').limit(1);
  if (error) {
    console.error("Error fetching organizations:", error);
  } else {
    console.log("Organization columns:", Object.keys(data[0] || {}));
  }
}

test();
