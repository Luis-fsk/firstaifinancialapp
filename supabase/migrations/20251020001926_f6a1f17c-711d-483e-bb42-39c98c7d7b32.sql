-- Fix critical RLS policy issues for privacy and data exposure

-- 1. Fix replies table - restrict to connection-based access
DROP POLICY IF EXISTS "Authenticated users can view replies" ON public.replies;

CREATE POLICY "Users can view replies on accessible posts"
  ON public.replies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = replies.post_id
      AND (
        posts.user_id = auth.uid()
        OR are_users_connected(auth.uid(), posts.user_id)
      )
    )
  );

-- 2. Fix post_likes table - restrict to connection-based access
DROP POLICY IF EXISTS "Authenticated users can view all post likes" ON public.post_likes;

CREATE POLICY "Users can view likes on accessible posts"
  ON public.post_likes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_likes.post_id
      AND (
        posts.user_id = auth.uid()
        OR are_users_connected(auth.uid(), posts.user_id)
      )
    )
  );

-- 3. Fix reply_likes table - restrict to connection-based access
DROP POLICY IF EXISTS "Authenticated users can view all reply likes" ON public.reply_likes;

CREATE POLICY "Users can view likes on accessible replies"
  ON public.reply_likes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.replies
      JOIN public.posts ON posts.id = replies.post_id
      WHERE replies.id = reply_likes.reply_id
      AND (
        posts.user_id = auth.uid()
        OR are_users_connected(auth.uid(), posts.user_id)
      )
    )
  );

-- 4. Create a safe profiles view that only exposes non-sensitive fields
CREATE OR REPLACE VIEW public.safe_profiles AS
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

-- Grant access to the view
GRANT SELECT ON public.safe_profiles TO authenticated;

-- Enable RLS on the view (views inherit RLS from base tables, but we're explicit)
ALTER VIEW public.safe_profiles SET (security_barrier = true);

-- Add comment explaining the view's purpose
COMMENT ON VIEW public.safe_profiles IS 'Safe profile view that excludes sensitive subscription and payment data for connection viewing';