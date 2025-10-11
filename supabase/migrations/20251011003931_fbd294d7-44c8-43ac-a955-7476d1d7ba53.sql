-- Corrigir views para não usar SECURITY DEFINER

-- Remover views antigas
DROP VIEW IF EXISTS public.public_posts;
DROP VIEW IF EXISTS public.public_replies;

-- Recriar views SEM security definer (mais seguro)
-- As views agora usam as políticas RLS da tabela subjacente
CREATE VIEW public.public_posts 
WITH (security_invoker=true) AS
SELECT 
  id,
  content,
  category,
  author_name,
  author_initials,
  image_url,
  likes_count,
  created_at,
  updated_at
FROM public.posts;

CREATE VIEW public.public_replies 
WITH (security_invoker=true) AS
SELECT 
  id,
  post_id,
  content,
  author_name,
  author_initials,
  image_url,
  likes_count,
  created_at
FROM public.replies;