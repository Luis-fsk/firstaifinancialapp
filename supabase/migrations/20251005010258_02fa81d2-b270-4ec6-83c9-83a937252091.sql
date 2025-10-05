-- Fix security issue: Restrict profiles table access to authenticated users only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Fix security issue: Allow users to delete their own messages
CREATE POLICY "Users can delete their own messages"
ON public.messages
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

-- Fix security issue: Allow users to delete connection requests
CREATE POLICY "Users can delete their connection requests"
ON public.connections
FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = connected_user_id);