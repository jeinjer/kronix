import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env.local or .env
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...value] = line.split('=');
  if (key && value) acc[key.trim()] = value.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

supabase.from('industries').select('*').then(res => console.log(JSON.stringify(res.data, null, 2)));
