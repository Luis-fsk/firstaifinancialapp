-- Add subscription fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN plan_type TEXT NOT NULL DEFAULT 'free_trial',
ADD COLUMN trial_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN subscription_id TEXT,
ADD COLUMN subscription_status TEXT,
ADD COLUMN subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- Add comment to explain plan types
COMMENT ON COLUMN public.profiles.plan_type IS 'Plan types: free_trial, premium';
COMMENT ON COLUMN public.profiles.subscription_status IS 'Mercado Pago subscription status: pending, authorized, paused, cancelled';

-- Update the handle_new_user function to set trial_start
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name, trial_start)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'username', 'user_' || substring(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
    now()
  );
  RETURN NEW;
END;
$function$;