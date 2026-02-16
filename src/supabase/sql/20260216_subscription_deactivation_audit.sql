BEGIN;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS deactivation_reason text;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS deactivated_at timestamptz;

COMMIT;
