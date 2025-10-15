-- Fix: Allow authenticated users to view all post likes (for displaying like counts)
-- This is necessary for showing like counts on posts in the UI

-- Add policy to allow viewing all post likes (read-only for counts)
CREATE POLICY "Authenticated users can view all post likes" 
ON public.post_likes 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Similarly, add policy for reply likes
CREATE POLICY "Authenticated users can view all reply likes" 
ON public.reply_likes 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Add comment explaining the security model
COMMENT ON TABLE public.post_likes IS 'Stores post likes. Users can like/unlike posts, and all authenticated users can see like counts. Individual like information is publicly visible to enable social features like "X people liked this post".';

COMMENT ON TABLE public.reply_likes IS 'Stores reply likes. Users can like/unlike replies, and all authenticated users can see like counts. Individual like information is publicly visible to enable social features.';