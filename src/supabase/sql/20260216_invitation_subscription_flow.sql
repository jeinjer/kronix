-- Invitation -> Subscription flow
-- Goals:
-- 1) Consume `saas_invitations` when a user signs up.
-- 2) Create a 7-day trial subscription on first signup after invite.
-- 3) Use these subscription states only: inactive, trial, pro, enterprise.

BEGIN;

-- We recreate this view at the end. Dropping it here avoids dependency
-- errors while replacing subscriptions.status.
DROP VIEW IF EXISTS public.subscriptions_details;

-- ---------------------------------------------------------------------------
-- Normalize invitation plans
-- ---------------------------------------------------------------------------
UPDATE public.saas_invitations
SET plan_type = CASE
  WHEN lower(coalesce(plan_type, '')) = 'enterprise' THEN 'enterprise'
  ELSE 'pro'
END
WHERE plan_type IS NULL
   OR lower(plan_type) NOT IN ('pro', 'enterprise');

ALTER TABLE public.saas_invitations
  ALTER COLUMN plan_type SET DEFAULT 'pro';

DO $$
DECLARE
  v_constraint record;
BEGIN
  FOR v_constraint IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.saas_invitations'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%plan_type%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.saas_invitations DROP CONSTRAINT %I',
      v_constraint.conname
    );
  END LOOP;
END;
$$;

ALTER TABLE public.saas_invitations
  ADD CONSTRAINT saas_invitations_plan_type_check
  CHECK (plan_type IN ('pro', 'enterprise'));

-- ---------------------------------------------------------------------------
-- Normalize subscriptions: plan_type + status enum migration
-- ---------------------------------------------------------------------------
UPDATE public.subscriptions
SET plan_type = CASE
  WHEN lower(coalesce(plan_type, '')) = 'enterprise' THEN 'enterprise'
  ELSE 'pro'
END
WHERE plan_type IS NULL
   OR lower(plan_type) NOT IN ('pro', 'enterprise');

ALTER TABLE public.subscriptions
  ALTER COLUMN plan_type SET DEFAULT 'pro',
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
  CHECK (plan_type IN ('pro', 'enterprise'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'subscription_status_v2'
  ) THEN
    CREATE TYPE public.subscription_status_v2 AS ENUM (
      'inactive',
      'trial',
      'pro',
      'enterprise'
    );
  END IF;
END;
$$;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS status_v2 public.subscription_status_v2;

UPDATE public.subscriptions
SET status_v2 = CASE
  WHEN lower(coalesce(status::text, '')) = 'enterprise' THEN 'enterprise'::public.subscription_status_v2
  WHEN lower(coalesce(status::text, '')) IN ('pro', 'active') THEN 'pro'::public.subscription_status_v2
  WHEN lower(coalesce(status::text, '')) IN ('trial', 'trialing') THEN 'trial'::public.subscription_status_v2
  WHEN lower(coalesce(status::text, '')) IN ('inactive', 'past_due', 'canceled', 'cancelled') THEN 'inactive'::public.subscription_status_v2
  ELSE 'inactive'::public.subscription_status_v2
END
WHERE status_v2 IS NULL;

UPDATE public.subscriptions
SET status_v2 = 'inactive'::public.subscription_status_v2
WHERE status_v2 IS NULL;

ALTER TABLE public.subscriptions
  ALTER COLUMN status_v2 SET DEFAULT 'trial'::public.subscription_status_v2,
  ALTER COLUMN status_v2 SET NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'subscriptions'
      AND column_name = 'status'
  ) THEN
    ALTER TABLE public.subscriptions DROP COLUMN status;
  END IF;
END;
$$;

ALTER TABLE public.subscriptions
  RENAME COLUMN status_v2 TO status;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'subscription_status'
  ) THEN
    BEGIN
      DROP TYPE public.subscription_status;
    EXCEPTION
      WHEN dependent_objects_still_exist THEN
        NULL;
    END;
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'subscription_status_v2'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'subscription_status'
  ) THEN
    ALTER TYPE public.subscription_status_v2 RENAME TO subscription_status;
  END IF;
END;
$$;

-- Deduplicate by user and enforce one subscription per user.
WITH ranked AS (
  SELECT
    id,
    user_id,
    row_number() OVER (
      PARTITION BY user_id
      ORDER BY created_at DESC NULLS LAST, id DESC
    ) AS rn
  FROM public.subscriptions
  WHERE user_id IS NOT NULL
)
DELETE FROM public.subscriptions s
USING ranked r
WHERE s.id = r.id
  AND r.rn > 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.subscriptions'::regclass
      AND conname = 'subscriptions_user_id_key'
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- Functions used by the auth/invitation/subscription flow
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, phone, is_superadmin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone'),
    false
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    updated_at = now();

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_saas_invitation_acceptance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation public.saas_invitations%ROWTYPE;
  v_paid_plan text;
BEGIN
  -- Ensure profile exists regardless of trigger execution order on auth.users.
  INSERT INTO public.profiles (id, email, full_name, avatar_url, phone, is_superadmin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone'),
    false
  )
  ON CONFLICT (id) DO NOTHING;

  SELECT *
  INTO v_invitation
  FROM public.saas_invitations
  WHERE lower(email) = lower(NEW.email)
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_invitation IS NULL THEN
    RETURN NEW;
  END IF;

  IF lower(coalesce(v_invitation.status, '')) IN ('inactive', 'revoked', 'blocked', 'banned') THEN
    RETURN NEW;
  END IF;

  v_paid_plan := CASE
    WHEN lower(coalesce(v_invitation.plan_type, '')) = 'enterprise' THEN 'enterprise'
    ELSE 'pro'
  END;

  INSERT INTO public.subscriptions (user_id, plan_type, status, valid_until)
  VALUES (
    NEW.id,
    v_paid_plan,
    'trial',
    now() + interval '7 days'
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    plan_type = EXCLUDED.plan_type,
    status = 'trial',
    valid_until = now() + interval '7 days';

  DELETE FROM public.saas_invitations
  WHERE id = v_invitation.id;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_first_organization_bonus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub_exists boolean;
BEGIN
  IF NEW.role <> 'owner' THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE user_id = NEW.user_id
  ) INTO v_sub_exists;

  IF NOT v_sub_exists THEN
    INSERT INTO public.subscriptions (user_id, plan_type, status, valid_until)
    VALUES (
      NEW.user_id,
      'pro',
      'trial',
      now() + interval '7 days'
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_org_subscription_status(p_org_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_build_object(
    'plan_type', s.plan_type,
    'status', s.status,
    'valid_until', s.valid_until,
    'is_valid', (
      s.status IN ('trial', 'pro', 'enterprise')
      AND (s.valid_until IS NULL OR s.valid_until > now())
    )
  )
  INTO v_result
  FROM public.subscriptions s
  JOIN public.organization_members om ON om.user_id = s.user_id
  WHERE om.organization_id = p_org_id
    AND om.role = 'owner'
  ORDER BY om.created_at ASC
  LIMIT 1;

  IF v_result IS NULL THEN
    RETURN json_build_object(
      'plan_type', 'pro',
      'status', 'inactive',
      'is_valid', false
    );
  END IF;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_expired_subscriptions()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  WITH expired AS (
    UPDATE public.subscriptions
    SET status = 'inactive'
    WHERE status IN (
        'trial',
        'pro',
        'enterprise'
      )
      AND valid_until IS NOT NULL
      AND valid_until <= now()
    RETURNING id
  )
  SELECT count(*) INTO v_count FROM expired;

  RETURN json_build_object(
    'success', true,
    'marked_inactive', v_count
  );
END;
$$;

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
  IF v_status = 'pro' THEN
    NEW.plan_type := 'pro';
    IF NEW.valid_until IS NULL OR NEW.valid_until <= now() THEN
      NEW.valid_until := now() + interval '30 days';
    END IF;
  ELSIF v_status = 'enterprise' THEN
    NEW.plan_type := 'enterprise';
    IF NEW.valid_until IS NULL OR NEW.valid_until <= now() THEN
      NEW.valid_until := now() + interval '30 days';
    END IF;
  ELSIF v_status IN ('trial', 'trialing') THEN
    IF v_plan NOT IN ('trial', 'pro', 'enterprise') THEN
      NEW.plan_type := 'trial';
    END IF;
    IF NEW.valid_until IS NULL OR NEW.valid_until <= now() THEN
      NEW.valid_until := now() + interval '7 days';
    END IF;
  ELSIF v_status = 'active' THEN
    IF NEW.plan_type NOT IN ('pro', 'enterprise') THEN
      NEW.plan_type := 'pro';
    END IF;
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

-- ---------------------------------------------------------------------------
-- Ensure auth triggers exist
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_proc p ON p.oid = t.tgfoid
    WHERE n.nspname = 'auth'
      AND c.relname = 'users'
      AND p.proname = 'handle_new_user'
      AND NOT t.tgisinternal
  ) THEN
    CREATE TRIGGER on_auth_user_created_profile
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_proc p ON p.oid = t.tgfoid
    WHERE n.nspname = 'auth'
      AND c.relname = 'users'
      AND p.proname = 'handle_saas_invitation_acceptance'
      AND NOT t.tgisinternal
  ) THEN
    CREATE TRIGGER on_auth_user_created_saas
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_saas_invitation_acceptance();
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- Keep admin frontend query stable
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.subscriptions_details AS
SELECT
  s.id,
  om.organization_id,
  o.name AS organization_name,
  p.email AS user_email,
  s.plan_type,
  s.status,
  s.valid_until,
  s.created_at
FROM public.subscriptions s
LEFT JOIN public.profiles p ON p.id = s.user_id
LEFT JOIN LATERAL (
  SELECT om1.organization_id
  FROM public.organization_members om1
  WHERE om1.user_id = s.user_id
  ORDER BY
    CASE WHEN om1.role = 'owner' THEN 0 ELSE 1 END,
    om1.created_at ASC
  LIMIT 1
) om ON true
LEFT JOIN public.organizations o ON o.id = om.organization_id;

COMMIT;
