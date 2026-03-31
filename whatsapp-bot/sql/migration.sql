-- SQL Script para añadir funcionalidad del Bot de WhatsApp
-- Ejecutar este archivo en el Editor SQL de Supabase

-- 1. Crear el tipo Enum para el estado de la sesión
CREATE TYPE bot_session_state AS ENUM (
  'GREETING', 
  'AWAITING_SERVICE', 
  'AWAITING_STAFF', 
  'AWAITING_DATE', 
  'AWAITING_TIME', 
  'CONFIRMING'
);

-- 2. Crear la tabla de sesiones
CREATE TABLE bot_sessions (
  phone_number text PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id),
  state bot_session_state DEFAULT 'GREETING',
  context jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS en bot_sessions (opcional, como es para el backend service role, no es estricto)
ALTER TABLE bot_sessions ENABLE ROW LEVEL SECURITY;

-- 3. Crear función de utilidad para obtener servicios disponibles por negocio
-- (Asumiendo que la tabla de servicios se llame services u organization_services)
-- Aquí solo creamos el esqueleto de policies si fueran necesarias.
-- Asumimos que los select a organizations y services son libres (como vimos en las policies actuales)

-- 4. Modificar policy existente en appointments (Opcional pero recomendado)
-- El CSV indica: appointments, Anon crea turnos, INSERT, {anon}, null, true
-- Idealmente la policy debería verse así para proteger multitenant:
/*
DROP POLICY "Anon crea turnos" ON appointments;
CREATE POLICY "Anon crea turnos protegida"
ON appointments
FOR INSERT
TO public
WITH CHECK (
  organization_id IS NOT NULL 
  -- Puedes añadir más chequeos si es necesario
);
*/
