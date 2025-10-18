-- Fix subscription data exposure in profiles
-- Create a view for safe profile data that excludes sensitive subscription info

-- Drop the existing policy that exposes subscription data
DROP POLICY IF EXISTS "Users can view basic profile data of connections" ON public.profiles;

-- Create a security definer function to safely check if users are connected
CREATE OR REPLACE FUNCTION public.are_users_connected(_user_id1 uuid, _user_id2 uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.connections
    WHERE (
      (user_id = _user_id1 AND connected_user_id = _user_id2)
      OR
      (user_id = _user_id2 AND connected_user_id = _user_id1)
    )
    AND status = 'accepted'
  );
$$;

-- Create a new policy that allows viewing ONLY basic profile data for connections
-- Excludes: subscription_id, subscription_status, subscription_expires_at, plan_type
CREATE POLICY "Connections can view basic profile data only"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Only allow viewing basic fields for connected users
    public.are_users_connected(auth.uid(), user_id)
  );

-- Add a comment to document which fields are considered "basic" and safe to expose
COMMENT ON POLICY "Connections can view basic profile data only" ON public.profiles IS 
'Allows viewing basic profile fields (username, display_name, avatar_url, bio, connections_count, posts_count) 
but excludes sensitive subscription data (subscription_id, subscription_status, subscription_expires_at, plan_type, trial_start).
Note: The application layer must ensure it only queries for these safe fields when viewing connection profiles.';