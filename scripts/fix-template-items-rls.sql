-- ============================================================
-- FIX: RLS Policy para schedule_template_items
-- 
-- PROBLEMA: La policy actual solo permite leer items de
-- templates que tienen organization_id (templates privados).
-- Los templates globales (organization_id IS NULL) son
-- bloqueados porque el JOIN a organization_members no
-- encuentra filas -> la policy retorna false.
--
-- SOLUCIÓN: Agregar una policy de SELECT que permita leer
-- items de templates globales (organization_id IS NULL)
-- a cualquier usuario autenticado.
-- ============================================================

-- Ver policies actuales (verificar antes de aplicar)
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'schedule_template_items';

-- Crear policy de lectura para templates globales
CREATE POLICY "Ver items de templates globales"
ON public.schedule_template_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM schedule_templates st
    WHERE st.id = schedule_template_items.template_id
      AND st.organization_id IS NULL
  )
);

-- Verificar que quedó bien
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'schedule_template_items';
