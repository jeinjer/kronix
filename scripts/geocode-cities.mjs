/**
 * Script para geocodificar todas las ciudades de la tabla `cities` en Supabase
 * usando la API de Nominatim (OpenStreetMap) con parámetros estructurados.
 * 
 * Prerequisitos:
 *   1. Ejecutar la migración SQL para agregar columnas latitude/longitude a cities
 *   2. Tener las variables de entorno VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
 *      (o VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY si el RLS lo permite)
 * 
 * Uso:
 *   node scripts/geocode-cities.mjs
 * 
 * Rate limit: 1 request/segundo (Nominatim policy)
 */

import { createClient } from '@supabase/supabase-js';

// --- Configuration ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing environment variables. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Example: VITE_SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/geocode-cities.mjs');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';
const RATE_LIMIT_MS = 1100; // Nominatim policy: max 1 request per second
const USER_AGENT = 'KronixGeocoder/1.0 (kronix.app)';

// --- Helpers ---
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function geocodeCity(cityName, provinceName) {
  const params = new URLSearchParams({
    city: cityName,
    state: provinceName,
    country: 'Argentina',
    format: 'json',
    limit: '1',
    addressdetails: '0',
  });

  const url = `${NOMINATIM_BASE}?${params.toString()}`;
  
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!response.ok) {
      console.warn(`  ⚠️  HTTP ${response.status} for "${cityName}, ${provinceName}"`);
      return null;
    }

    const data = await response.json();
    
    if (data.length === 0) {
      // Fallback: try with q= parameter as last resort (more permissive)
      const fallbackParams = new URLSearchParams({
        q: `${cityName}, ${provinceName}, Argentina`,
        format: 'json',
        limit: '1',
        addressdetails: '0',
      });
      
      const fallbackUrl = `${NOMINATIM_BASE}?${fallbackParams.toString()}`;
      const fallbackResp = await fetch(fallbackUrl, {
        headers: { 'User-Agent': USER_AGENT },
      });
      
      if (fallbackResp.ok) {
        const fallbackData = await fallbackResp.json();
        if (fallbackData.length > 0) {
          console.log(`  🔄 Fallback match for "${cityName}" → (${fallbackData[0].lat}, ${fallbackData[0].lon})`);
          return { lat: parseFloat(fallbackData[0].lat), lon: parseFloat(fallbackData[0].lon) };
        }
      }
      
      return null;
    }

    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch (err) {
    console.error(`  ❌ Network error for "${cityName}": ${err.message}`);
    return null;
  }
}

// --- Main ---
async function main() {
  console.log('🗺️  Kronix City Geocoder');
  console.log('========================\n');

  // 1. Fetch all provinces
  const { data: provinces, error: provError } = await supabase
    .from('provinces')
    .select('id, name')
    .order('name');

  if (provError) {
    console.error('❌ Error fetching provinces:', provError.message);
    process.exit(1);
  }

  console.log(`📋 Found ${provinces.length} provinces\n`);

  // 2. Fetch all cities (join with province name)
  const { data: cities, error: citiesError } = await supabase
    .from('cities')
    .select('id, name, province_id, latitude, longitude')
    .order('name');

  if (citiesError) {
    console.error('❌ Error fetching cities:', citiesError.message);
    process.exit(1);
  }

  console.log(`📋 Found ${cities.length} cities total`);

  // Filter to only cities without coordinates
  const citiesToGeocode = cities.filter(c => !c.latitude || !c.longitude);
  console.log(`🎯 ${citiesToGeocode.length} cities need geocoding\n`);

  if (citiesToGeocode.length === 0) {
    console.log('✅ All cities already have coordinates. Nothing to do!');
    return;
  }

  // Build province lookup map
  const provinceMap = {};
  for (const p of provinces) {
    provinceMap[p.id] = p.name;
  }

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < citiesToGeocode.length; i++) {
    const city = citiesToGeocode[i];
    const provinceName = provinceMap[city.province_id] || 'Unknown';
    
    process.stdout.write(`[${i + 1}/${citiesToGeocode.length}] "${city.name}" (${provinceName})... `);

    const coords = await geocodeCity(city.name, provinceName);

    if (coords) {
      // Update Supabase
      const { error: updateError } = await supabase
        .from('cities')
        .update({ latitude: coords.lat, longitude: coords.lon })
        .eq('id', city.id);

      if (updateError) {
        console.log(`❌ DB update failed: ${updateError.message}`);
        failCount++;
      } else {
        console.log(`✅ (${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)})`);
        successCount++;
      }
    } else {
      console.log(`⚠️  No results found`);
      failCount++;
    }

    // Rate limit
    if (i < citiesToGeocode.length - 1) {
      await sleep(RATE_LIMIT_MS);
    }
  }

  console.log('\n========================');
  console.log(`🏁 Done! ✅ ${successCount} geocoded | ⚠️ ${failCount} failed`);
  
  if (failCount > 0) {
    console.log('\n💡 For failed cities, you can manually set coordinates in Supabase Dashboard.');
  }
}

main().catch(console.error);
