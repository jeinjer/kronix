BEGIN;

-- Alineamos plan_type para soportar: trial, pro, enterprise.
UPDATE public.subscriptions
SET plan_type = CASE
  WHEN lower(coalesce(plan_type, '')) IN ('trial', 'pro', 'enterprise') THEN lower(plan_type)
  WHEN lower(coalesce(status::text, '')) IN ('trial', 'pro', 'enterprise') THEN lower(status::text)
  ELSE 'pro'
END
WHERE plan_type IS NULL
   OR lower(plan_type) NOT IN ('trial', 'pro', 'enterprise');

ALTER TABLE public.subscriptions
  ALTER COLUMN plan_type SET DEFAULT 'trial',
  ALTER COLUMN plan_type SET NOT NULL;

DO $$
DECLARE
  v_constraint record;
BEGIN
  FOR v_constraint IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.subscriptions'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%plan_type%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.subscriptions DROP CONSTRAINT %I',
      v_constraint.conname
    );
  END LOOP;
END;
$$;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_plan_type_check
  CHECK (plan_type IN ('trial', 'pro', 'enterprise'));

CREATE OR REPLACE FUNCTION public.admin_apply_subscription_adjustment(
  p_subscription_id uuid,
  p_plan_type text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_extra_days integer DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid uuid;
  v_is_superadmin boolean := false;
  v_sub public.subscriptions%ROWTYPE;
  v_plan text;
  v_current_plan text;
  v_current_status text;
  v_activity_status text;
  v_internal_status text;
  v_status_type text;
  v_status_labels text[];
  v_extra_days integer := greatest(coalesce(p_extra_days, 0), 0);
  v_now timestamptz := now();
  v_new_valid_until timestamptz;
BEGIN
  v_uid := auth.uid();

  IF v_uid IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'No autenticado.'
    );
  END IF;

  SELECT p.is_superadmin
  INTO v_is_superadmin
  FROM public.profiles p
  WHERE p.id = v_uid;

  IF coalesce(v_is_superadmin, false) = false THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Permisos insuficientes.'
    );
  END IF;

  SELECT *
  INTO v_sub
  FROM public.subscriptions
  WHERE id = p_subscription_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Suscripcion no encontrada.'
    );
  END IF;

  SELECT a.atttypid::regtype::text
  INTO v_status_type
  FROM pg_attribute a
  WHERE a.attrelid = 'public.subscriptions'::regclass
    AND a.attname = 'status'
    AND NOT a.attisdropped;

  SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder)
  INTO v_status_labels
  FROM pg_attribute a
  JOIN pg_enum e ON e.enumtypid = a.atttypid
  WHERE a.attrelid = 'public.subscriptions'::regclass
    AND a.attname = 'status'
    AND NOT a.attisdropped;

  IF v_status_type IS NULL OR v_status_labels IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'No se pudo resolver el tipo de estado de suscripciones.'
    );
  END IF;

  v_current_status := lower(coalesce(v_sub.status::text, ''));

  -- Plan actual real (si status usa trial/pro/enterprise, manda ese valor).
  v_current_plan := CASE
    WHEN v_current_status IN ('trial', 'pro', 'enterprise') THEN v_current_status
    WHEN lower(coalesce(v_sub.plan_type, '')) IN ('trial', 'pro', 'enterprise') THEN lower(v_sub.plan_type)
    ELSE 'pro'
  END;

  IF p_plan_type IS NULL OR trim(p_plan_type) = '' THEN
    v_plan := v_current_plan;
  ELSIF lower(trim(p_plan_type)) IN ('trial', 'pro', 'enterprise') THEN
    v_plan := lower(trim(p_plan_type));
  ELSE
    RETURN json_build_object(
      'success', false,
      'message', 'Plan invalido.'
    );
  END IF;

  -- Estado simplificado para frontend: active / inactive.
  IF p_status IS NULL OR trim(p_status) = '' THEN
    v_activity_status := CASE
      WHEN v_current_status IN ('inactive', 'past_due', 'canceled', 'cancelled') THEN 'inactive'
      ELSE 'active'
    END;
  ELSE
    CASE lower(trim(p_status))
      WHEN 'active' THEN v_activity_status := 'active';
      WHEN 'inactive' THEN v_activity_status := 'inactive';
      ELSE
        RETURN json_build_object(
          'success', false,
          'message', 'Estado invalido. Usa active o inactive.'
        );
    END CASE;
  END IF;

  IF v_activity_status = 'inactive' THEN
    IF 'inactive' = ANY(v_status_labels) THEN
      v_internal_status := 'inactive';
    ELSIF 'past_due' = ANY(v_status_labels) THEN
      v_internal_status := 'past_due';
    ELSIF 'canceled' = ANY(v_status_labels) THEN
      v_internal_status := 'canceled';
    ELSIF 'cancelled' = ANY(v_status_labels) THEN
      v_internal_status := 'cancelled';
    ELSE
      RETURN json_build_object(
        'success', false,
        'message', 'El enum de status no tiene un valor para inactivo.'
      );
    END IF;
  ELSE
    IF v_plan = 'trial' AND 'trial' = ANY(v_status_labels) THEN
      v_internal_status := 'trial';
    ELSIF v_plan = 'pro' AND 'pro' = ANY(v_status_labels) THEN
      v_internal_status := 'pro';
    ELSIF v_plan = 'enterprise' AND 'enterprise' = ANY(v_status_labels) THEN
      v_internal_status := 'enterprise';
    ELSIF 'active' = ANY(v_status_labels) THEN
      v_internal_status := 'active';
    ELSIF 'trialing' = ANY(v_status_labels) THEN
      v_internal_status := 'trialing';
    ELSE
      RETURN json_build_object(
        'success', false,
        'message', 'El enum de status no tiene un valor para activo.'
      );
    END IF;
  END IF;

  v_new_valid_until := v_sub.valid_until;

  IF v_extra_days > 0 THEN
    v_new_valid_until :=
      (
        CASE
          WHEN v_new_valid_until IS NOT NULL AND v_new_valid_until > v_now THEN v_new_valid_until
          ELSE v_now
        END
      )
      + make_interval(days => v_extra_days);
  END IF;

  IF v_activity_status = 'active'
     AND (v_new_valid_until IS NULL OR v_new_valid_until <= v_now) THEN
    IF v_plan = 'trial' THEN
      v_new_valid_until := v_now + interval '7 days';
    ELSE
      v_new_valid_until := v_now + interval '30 days';
    END IF;
  END IF;

  EXECUTE format(
    'UPDATE public.subscriptions
     SET plan_type = $1,
         status = $2::%s,
         valid_until = $3
     WHERE id = $4',
    v_status_type
  )
  USING v_plan, v_internal_status, v_new_valid_until, p_subscription_id;

  RETURN json_build_object(
    'success', true,
    'subscription_id', p_subscription_id,
    'plan_type', v_plan,
    'status', v_activity_status,
    'internal_status', v_internal_status,
    'valid_until', v_new_valid_until
  );
END;
$$;

GRANT EXECUTE
ON FUNCTION public.admin_apply_subscription_adjustment(uuid, text, text, integer)
TO authenticated;

-- Compatibilidad: evita errores de casteo enum en triggers viejos
-- (ej. IF NEW.status = 'pro' cuando el enum no tiene ese valor).
CREATE OR REPLACE FUNCTION public.handle_subscription_reactivation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text := lower(coalesce(NEW.status::text, ''));
  v_plan text := lower(coalesce(NEW.plan_type, ''));
BEGIN
  IF v_status = 'enterprise' THEN
    NEW.plan_type := 'enterprise';
  ELSIF v_status = 'pro' THEN
    NEW.plan_type := 'pro';
  ELSIF v_status IN ('trial', 'trialing') THEN
    IF v_plan NOT IN ('trial', 'pro', 'enterprise') THEN
      NEW.plan_type := 'trial';
    END IF;
  ELSIF v_status = 'active' THEN
    IF v_plan NOT IN ('trial', 'pro', 'enterprise') THEN
      NEW.plan_type := 'pro';
    END IF;
  END IF;

  IF v_status IN ('trial', 'trialing') THEN
    IF NEW.valid_until IS NULL OR NEW.valid_until <= now() THEN
      NEW.valid_until := now() + interval '7 days';
    END IF;
  ELSIF v_status IN ('pro', 'enterprise') THEN
    IF NEW.valid_until IS NULL OR NEW.valid_until <= now() THEN
      NEW.valid_until := now() + interval '30 days';
    END IF;
  ELSIF v_status = 'active' THEN
    IF NEW.valid_until IS NULL OR NEW.valid_until <= now() THEN
      IF lower(coalesce(NEW.plan_type, '')) = 'trial' THEN
        NEW.valid_until := now() + interval '7 days';
      ELSE
        NEW.valid_until := now() + interval '30 days';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMIT;
