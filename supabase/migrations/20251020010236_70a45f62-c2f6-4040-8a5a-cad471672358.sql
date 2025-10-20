-- Remove a view safe_profiles que está com SECURITY DEFINER
DROP VIEW IF EXISTS public.safe_profiles;

-- Recriar a view sem SECURITY DEFINER (usando SECURITY INVOKER por padrão)
CREATE VIEW public.safe_profiles 
WITH (security_invoker = true)
AS
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