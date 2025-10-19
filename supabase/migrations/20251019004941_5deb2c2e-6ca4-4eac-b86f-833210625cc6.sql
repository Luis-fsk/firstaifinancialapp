-- Fix critical security vulnerabilities (final fix)

-- 1. Fix connection fraud vulnerability
DROP POLICY IF EXISTS "Users can update their connection status" ON public.connections;
DROP POLICY IF EXISTS "Users can cancel their own connection requests" ON public.connections;
DROP POLICY IF EXISTS "Users can respond to connection requests" ON public.connections;

CREATE POLICY "Users can cancel their own connection requests"
  ON public.connections
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled');

CREATE POLICY "Users can respond to connection requests"
  ON public.connections
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = connected_user_id)
  WITH CHECK (auth.uid() = connected_user_id AND status IN ('accepted', 'rejected'));

-- 2. Fix message modification vulnerability
DROP POLICY IF EXISTS "Users can update their received messages" ON public.messages;
DROP POLICY IF EXISTS "Users can mark received messages as read" ON public.messages;

CREATE POLICY "Users can mark received messages as read"
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id);

-- Add a trigger to prevent content modification
CREATE OR REPLACE FUNCTION public.prevent_message_content_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.content <> OLD.content OR NEW.sender_id <> OLD.sender_id OR NEW.receiver_id <> OLD.receiver_id THEN
    RAISE EXCEPTION 'Cannot modify message content, sender, or receiver';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_message_content_change_trigger ON public.messages;
CREATE TRIGGER prevent_message_content_change_trigger
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_message_content_change();

-- 3. Fix post engagement manipulation
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own post content" ON public.posts;

CREATE POLICY "Users can update their own post content"
  ON public.posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add a trigger to prevent likes_count manipulation
CREATE OR REPLACE FUNCTION public.prevent_post_likes_manipulation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.likes_count <> OLD.likes_count OR NEW.user_id <> OLD.user_id THEN
    RAISE EXCEPTION 'Cannot modify likes_count or user_id directly';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_post_likes_manipulation_trigger ON public.posts;
CREATE TRIGGER prevent_post_likes_manipulation_trigger
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_post_likes_manipulation();

-- 4. Manage likes_count via triggers (posts)
CREATE OR REPLACE FUNCTION public.handle_post_like_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS post_like_change_trigger ON public.post_likes;
CREATE TRIGGER post_like_change_trigger
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_post_like_change();

-- 5. Manage likes_count via triggers (replies)
CREATE OR REPLACE FUNCTION public.handle_reply_like_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.replies
    SET likes_count = likes_count + 1
    WHERE id = NEW.reply_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.replies
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.reply_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS reply_like_change_trigger ON public.reply_likes;
CREATE TRIGGER reply_like_change_trigger
  AFTER INSERT OR DELETE ON public.reply_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_reply_like_change();