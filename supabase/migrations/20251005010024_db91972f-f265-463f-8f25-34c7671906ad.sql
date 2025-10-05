-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create cron job to fetch news daily at 5 AM Brasilia time (8 AM UTC)
SELECT cron.schedule(
  'fetch-news-daily',
  '0 8 * * *', -- 8 AM UTC = 5 AM BRT
  $$
  SELECT
    net.http_post(
        url:='https://qjehcyogixkoixipkulc.supabase.co/functions/v1/fetch-news',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqZWhjeW9naXhrb2l4aXBrdWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMTc2MjQsImV4cCI6MjA3NDU5MzYyNH0.IzbPFO0XEX7QNVCZE_qdvCCPE0Jm7gI7ZVlCYh-ymUs"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);