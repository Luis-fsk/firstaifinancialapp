-- Add DELETE policy for ai_sessions to allow users to clean up their own data
CREATE POLICY "Users can delete their own AI sessions"
ON public.ai_sessions
FOR DELETE
USING (auth.uid() = user_id);

-- Add comment to profiles table documenting column-level security approach
COMMENT ON TABLE public.profiles IS 'Sensitive columns (subscription_id, subscription_status, subscription_expires_at, plan_type, trial_start) are protected via application-layer column selection. The RLS policy allows connections to SELECT, but the application only requests safe fields: id, user_id, username, display_name, avatar_url, bio, connections_count, posts_count, created_at, updated_at';