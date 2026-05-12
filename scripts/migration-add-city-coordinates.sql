-- ========================================================
-- Kronix: Migration — Add coordinates to cities table
-- ========================================================
-- Run this in the Supabase SQL Editor.

-- Step 1: Add latitude/longitude columns
ALTER TABLE public.cities
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

COMMENT ON COLUMN public.cities.latitude IS 'Latitud geocodificada de la ciudad';
COMMENT ON COLUMN public.cities.longitude IS 'Longitud geocodificada de la ciudad';

-- Step 2: Drop ALL existing overloads to avoid PGRST203 ambiguity
DROP FUNCTION IF EXISTS get_cities_by_province(INT);

-- Step 3: Recreate with coordinates in the return type
CREATE OR REPLACE FUNCTION get_cities_by_province(p_province_id INT)
RETURNS TABLE(id INT, name TEXT, latitude DOUBLE PRECISION, longitude DOUBLE PRECISION) AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.name, c.latitude, c.longitude
  FROM cities c
  WHERE c.province_id = p_province_id
  ORDER BY c.name ASC;
END;
$$ LANGUAGE plpgsql;
