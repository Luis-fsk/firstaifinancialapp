-- Enable extensions for cron jobs (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule fetch-news to run daily at 6 AM
SELECT cron.schedule(
  'fetch-daily-news',
  '0 6 * * *', -- At 6:00 AM every day
  $$
  SELECT
    net.http_post(
        url:='https://qjehcyogixkoixipkulc.supabase.co/functions/v1/fetch-news',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqZWhjeW9naXhrb2l4aXBrdWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMTc2MjQsImV4cCI6MjA3NDU5MzYyNH0.IzbPFO0XEX7QNVCZE_qdvCCPE0Jm7gI7ZVlCYh-ymUs"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Create function to delete user account
CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;