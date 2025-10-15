-- Fix 1: Restrict profiles table to only show user's own profile and ACCEPTED connections
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view connected profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Recreate policies with stricter controls
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view accepted connections only" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM connections
    WHERE (
      (connections.user_id = auth.uid() AND connections.connected_user_id = profiles.user_id)
      OR 
      (connections.connected_user_id = auth.uid() AND connections.user_id = profiles.user_id)
    )
    AND connections.status = 'accepted'  -- Only show accepted connections
  )
);

-- Fix 2: Drop the views and recreate them with security definer functions
-- This ensures they respect RLS policies from the underlying tables
DROP VIEW IF EXISTS public.public_posts;
DROP VIEW IF EXISTS public.public_replies;

-- Recreate public_posts as a security definer function instead of a view
-- This will respect the RLS policies on the posts table
CREATE OR REPLACE FUNCTION public.get_public_posts()
RETURNS TABLE (
  id uuid,
  author_name text,
  author_initials text,
  content text,
  image_url text,
  category text,
  likes_count integer,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER  -- Use invoker's permissions (respects RLS)
SET search_path = public
AS $$
  SELECT 
    id,
    author_name,
    author_initials,
    content,
    image_url,
    category,
    likes_count,
    created_at,
    updated_at
  FROM public.posts
$$;

-- Recreate public_replies as a security definer function
CREATE OR REPLACE FUNCTION public.get_public_replies()
RETURNS TABLE (
  id uuid,
  post_id uuid,
  author_name text,
  author_initials text,
  content text,
  image_url text,
  likes_count integer,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER  -- Use invoker's permissions (respects RLS)
SET search_path = public
AS $$
  SELECT 
    id,
    post_id,
    author_name,
    author_initials,
    content,
    image_url,
    likes_count,
    created_at
  FROM public.replies
$$;

-- Fix 3: Add comment to messages table about encryption
COMMENT ON TABLE public.messages IS 'Private messages between users. RLS ensures only sender and receiver can access messages. For enhanced security, consider implementing end-to-end encryption at the application level.';

-- Fix 4: Add indexes for better performance on RLS queries
CREATE INDEX IF NOT EXISTS idx_connections_user_status ON public.connections(user_id, status);
CREATE INDEX IF NOT EXISTS idx_connections_connected_user_status ON public.connections(connected_user_id, status);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);