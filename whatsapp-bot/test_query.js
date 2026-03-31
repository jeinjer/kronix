import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

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
