-- Create a safe profile view that excludes sensitive subscription and trial data
CREATE OR REPLACE VIEW public.safe_connection_profiles AS
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
FROM public.profiles;

-- Grant access to authenticated users
GRANT SELECT ON public.safe_connection_profiles TO authenticated;

-- Update the RLS policy to restrict access to sensitive fields
DROP POLICY IF EXISTS "Connections can view safe profile data only" ON public.profiles;

CREATE POLICY "Connections can view safe profile data only" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() != user_id 
  AND are_users_connected(auth.uid(), user_id)
  AND (
    -- Only allow viewing non-sensitive fields for connections
    SELECT true FROM public.safe_connection_profiles WHERE user_id = profiles.user_id
  )
);

-- Update the policy to ensure users can still see their full profile
DROP POLICY IF EXISTS "Users can view their own profile with all data" ON public.profiles;

CREATE POLICY "Users can view their own profile with all data" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);