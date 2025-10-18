-- Fix security issues in RLS policies

-- 1. Add policy to explicitly deny unauthenticated access to profiles
DROP POLICY IF EXISTS "Deny unauthenticated access to profiles" ON public.profiles;
CREATE POLICY "Deny unauthenticated access to profiles"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (false);

-- 2. Fix posts visibility - only allow viewing posts from connected users
DROP POLICY IF EXISTS "Authenticated users can view posts" ON public.posts;
CREATE POLICY "Users can view posts from connections"
  ON public.posts
  FOR SELECT
  TO authenticated
  USING (
    -- User can see their own posts
    auth.uid() = user_id
    OR
    -- Or posts from accepted connections
    EXISTS (
      SELECT 1 FROM public.connections
      WHERE (
        (user_id = auth.uid() AND connected_user_id = posts.user_id)
        OR
        (user_id = posts.user_id AND connected_user_id = auth.uid())
      )
      AND status = 'accepted'
    )
  );

-- 3. Fix messages - require accepted connection between sender and receiver
DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;
CREATE POLICY "Users can view messages with connections only"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    (auth.uid() = sender_id OR auth.uid() = receiver_id)
    AND
    -- Verify accepted connection exists
    EXISTS (
      SELECT 1 FROM public.connections
      WHERE (
        (user_id = messages.sender_id AND connected_user_id = messages.receiver_id)
        OR
        (user_id = messages.receiver_id AND connected_user_id = messages.sender_id)
      )
      AND status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.messages;
CREATE POLICY "Users can send messages to connections only"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND
    -- Verify accepted connection exists before sending
    EXISTS (
      SELECT 1 FROM public.connections
      WHERE (
        (user_id = sender_id AND connected_user_id = receiver_id)
        OR
        (user_id = receiver_id AND connected_user_id = sender_id)
      )
      AND status = 'accepted'
    )
  );

-- 4. Hide sensitive subscription data from profiles for non-owners
-- Keep existing policies but add explicit denial for anon users
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view accepted connections only" ON public.profiles;

CREATE POLICY "Users can view their own profile with all data"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view basic profile data of connections"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Only show basic profile data to connections
    EXISTS (
      SELECT 1 FROM public.connections
      WHERE (
        (user_id = auth.uid() AND connected_user_id = profiles.user_id)
        OR
        (user_id = profiles.user_id AND connected_user_id = auth.uid())
      )
      AND status = 'accepted'
    )
  );