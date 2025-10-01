-- Function to delete user account and all related data
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete from profiles (cascades will handle other tables)
  DELETE FROM public.profiles WHERE user_id = auth.uid();
  
  -- Delete the auth user
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;