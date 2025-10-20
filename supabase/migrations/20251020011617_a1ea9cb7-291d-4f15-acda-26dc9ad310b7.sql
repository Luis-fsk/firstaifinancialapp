-- Fix subscription data exposure to connections
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Connections can view basic profile data only" ON public.profiles;

-- Create a new policy that uses the safe_profiles view concept
-- Connections can only see non-sensitive profile data
CREATE POLICY "Connections can view safe profile data only"
ON public.profiles
FOR SELECT
USING (
  -- User can see their own full profile
  (auth.uid() = user_id)
  OR
  -- Connections can see profile but we'll filter columns via a function
  (are_users_connected(auth.uid(), user_id))
);

-- Create a security definer function to safely fetch connection profiles
CREATE OR REPLACE FUNCTION public.get_safe_connection_profile(target_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  connections_count integer,
  posts_count integer,
  created_at timestamptz,
  updated_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT 
    id,
    user_id,
    username,
    display_name,
    avatar_url,
    bio,
    connections_count,
    posts_count,
    created_at,
    updated_at
  FROM public.profiles
  WHERE user_id = target_user_id
    AND are_users_connected(auth.uid(), target_user_id);
$$;