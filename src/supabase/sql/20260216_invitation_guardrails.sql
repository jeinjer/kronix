BEGIN;

UPDATE public.saas_invitations
SET email = lower(trim(email))
WHERE email IS NOT NULL;

WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY lower(email)
      ORDER BY created_at DESC NULLS LAST, id DESC
    ) AS rn
  FROM public.saas_invitations
)
DELETE FROM public.saas_invitations i
USING ranked r
WHERE i.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS saas_invitations_email_lower_key
ON public.saas_invitations (lower(email));

CREATE OR REPLACE FUNCTION public.guard_saas_invitation_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.email := lower(trim(NEW.email));

  IF NEW.email IS NULL OR NEW.email = '' THEN
    RAISE EXCEPTION USING MESSAGE = 'El correo es obligatorio.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.subscriptions s ON s.user_id = p.id
    WHERE lower(p.email) = NEW.email
  ) THEN
    RAISE EXCEPTION USING MESSAGE = 'Ese correo ya tiene una suscripcion.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_guard_saas_invitation_email ON public.saas_invitations;

CREATE TRIGGER trigger_guard_saas_invitation_email
BEFORE INSERT OR UPDATE ON public.saas_invitations
FOR EACH ROW
EXECUTE FUNCTION public.guard_saas_invitation_email();

COMMIT;
