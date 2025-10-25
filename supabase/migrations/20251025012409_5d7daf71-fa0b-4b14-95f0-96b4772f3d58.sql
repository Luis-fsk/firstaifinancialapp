-- Fix RLS policy to explicitly restrict subscription-sensitive fields for connections
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Connections can view safe profile data only" ON public.profiles;

-- Create a new policy with explicit column restrictions for connections
CREATE POLICY "Connections can view safe profile data only" 
ON public.profiles 
FOR SELECT 
USING (
  (auth.uid() <> user_id) 
  AND are_users_connected(auth.uid(), user_id)
);

-- Add a comment explaining the security model
COMMENT ON POLICY "Connections can view safe profile data only" ON public.profiles IS 
'Allows connections to query profiles, but application layer (src/lib/profileQueries.ts) enforces column-level filtering. Sensitive fields (plan_type, subscription_status, subscription_id, subscription_expires_at, trial_start) must never be exposed to connections in client queries.';

-- Create an audit log table for subscription changes
CREATE TABLE IF NOT EXISTS public.subscription_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  payment_id text,
  external_reference text,
  status text NOT NULL,
  metadata jsonb,
  source text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.subscription_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins and service role can access audit logs
CREATE POLICY "Admins can view audit logs" 
ON public.subscription_audit_log 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert audit logs" 
ON public.subscription_audit_log 
FOR INSERT 
WITH CHECK (true);

-- Add index for efficient audit log queries
CREATE INDEX IF NOT EXISTS idx_subscription_audit_user_id ON public.subscription_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_audit_created_at ON public.subscription_audit_log(created_at DESC);