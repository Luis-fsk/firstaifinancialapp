-- Remove safe_profiles view if it exists (unused and insecure)
DROP VIEW IF EXISTS public.safe_profiles CASCADE;