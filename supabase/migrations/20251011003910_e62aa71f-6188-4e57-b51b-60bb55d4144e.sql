-- CORREÇÕES DE SEGURANÇA

-- 1. Remover políticas RLS que expõem dados de usuários publicamente
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
DROP POLICY IF EXISTS "Anyone can view replies" ON public.replies;
DROP POLICY IF EXISTS "Anyone can view post likes" ON public.post_likes;
DROP POLICY IF EXISTS "Anyone can view reply likes" ON public.reply_likes;

-- 2. Criar políticas RLS seguras que NÃO expõem user_id
-- Posts: apenas usuários autenticados podem ver posts
CREATE POLICY "Authenticated users can view posts" 
ON public.posts 
FOR SELECT 
TO authenticated
USING (true);

-- Replies: apenas usuários autenticados podem ver respostas
CREATE POLICY "Authenticated users can view replies" 
ON public.replies 
FOR SELECT 
TO authenticated
USING (true);

-- Post likes: usuários só veem suas próprias curtidas + contagem total
CREATE POLICY "Users can view their own post likes" 
ON public.post_likes 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Reply likes: usuários só veem suas próprias curtidas
CREATE POLICY "Users can view their own reply likes" 
ON public.reply_likes 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- 3. Criar views seguras para dados públicos (SEM user_id)
CREATE OR REPLACE VIEW public.public_posts AS
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

CREATE OR REPLACE VIEW public.public_replies AS
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

-- 4. Função para verificar se usuário curtiu um post (sem expor user_id)
CREATE OR REPLACE FUNCTION public.user_liked_post(post_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.post_likes
    WHERE post_id = post_id_param
      AND user_id = auth.uid()
  );
$$;

-- 5. Função para verificar se usuário curtiu uma resposta
CREATE OR REPLACE FUNCTION public.user_liked_reply(reply_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.reply_likes
    WHERE reply_id = reply_id_param
      AND user_id = auth.uid()
  );
$$;

-- 6. Políticas para news_articles - apenas autenticados podem inserir/atualizar
-- (leitura já está pública, o que é OK para notícias)
DROP POLICY IF EXISTS "Only authenticated users can insert news" ON public.news_articles;
DROP POLICY IF EXISTS "Only authenticated users can update news" ON public.news_articles;

CREATE POLICY "Service role can insert news" 
ON public.news_articles 
FOR INSERT 
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update news" 
ON public.news_articles 
FOR UPDATE 
TO service_role
USING (true);

-- 7. Garantir que user_id não é nullable nas tabelas críticas
-- (Previne ataques de RLS bypass)
ALTER TABLE public.posts 
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.replies 
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.post_likes 
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.reply_likes 
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.connections
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN connected_user_id SET NOT NULL;

ALTER TABLE public.messages
  ALTER COLUMN sender_id SET NOT NULL,
  ALTER COLUMN receiver_id SET NOT NULL;

ALTER TABLE public.profiles
  ALTER COLUMN user_id SET NOT NULL;