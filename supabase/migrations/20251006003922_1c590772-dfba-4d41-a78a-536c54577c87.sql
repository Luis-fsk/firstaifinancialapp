-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Create new restricted policy: users can view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create policy: users can view profiles they are connected with
CREATE POLICY "Users can view connected profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.connections
    WHERE (
      (connections.user_id = auth.uid() AND connections.connected_user_id = profiles.user_id)
      OR
      (connections.connected_user_id = auth.uid() AND connections.user_id = profiles.user_id)
    )
  )
);