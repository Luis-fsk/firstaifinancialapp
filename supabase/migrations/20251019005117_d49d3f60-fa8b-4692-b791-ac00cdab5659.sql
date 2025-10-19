-- Fix remaining security warnings - add search_path to functions

CREATE OR REPLACE FUNCTION public.prevent_message_content_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.content <> OLD.content OR NEW.sender_id <> OLD.sender_id OR NEW.receiver_id <> OLD.receiver_id THEN
    RAISE EXCEPTION 'Cannot modify message content, sender, or receiver';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_post_likes_manipulation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.likes_count <> OLD.likes_count OR NEW.user_id <> OLD.user_id THEN
    RAISE EXCEPTION 'Cannot modify likes_count or user_id directly';
  END IF;
  RETURN NEW;
END;
$$;