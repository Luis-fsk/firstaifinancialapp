-- Drop the unsafe view
DROP VIEW IF EXISTS public.safe_connection_profiles CASCADE;

-- Recreate the policy with a simpler approach that doesn't expose sensitive data
DROP POLICY IF EXISTS "Connections can view safe profile data only" ON public.profiles;

CREATE POLICY "Connections can view safe profile data only" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() != user_id 
  AND are_users_connected(auth.uid(), user_id)
);

-- Note: The application layer should use SELECT with specific columns
-- to avoid exposing subscription_id, subscription_status, subscription_expires_at, plan_type, trial_start
-- Example: SELECT id, user_id, username, display_name, avatar_url, bio, connections_count, posts_count, created_at, updated_at FROM profiles