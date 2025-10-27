-- Create table to track rate limiting per user and endpoint
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can manage rate limits (edge functions use service role)
CREATE POLICY "Service role can manage rate limits"
ON public.rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for fast lookups
CREATE INDEX idx_rate_limits_user_endpoint ON public.rate_limits(user_id, endpoint);

-- Auto-update updated_at
CREATE TRIGGER update_rate_limits_updated_at
BEFORE UPDATE ON public.rate_limits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check and increment rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _user_id uuid,
  _endpoint text,
  _max_requests integer DEFAULT 10,
  _window_minutes integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count integer;
  window_start timestamptz;
  is_allowed boolean;
BEGIN
  -- Get or create rate limit record
  SELECT request_count, rate_limits.window_start
  INTO current_count, window_start
  FROM public.rate_limits
  WHERE user_id = _user_id AND endpoint = _endpoint;
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.rate_limits (user_id, endpoint, request_count, window_start)
    VALUES (_user_id, _endpoint, 1, now());
    
    RETURN jsonb_build_object(
      'allowed', true,
      'remaining', _max_requests - 1,
      'reset_at', now() + (_window_minutes || ' minutes')::interval
    );
  END IF;
  
  -- Check if window has expired
  IF window_start + (_window_minutes || ' minutes')::interval < now() THEN
    -- Reset window
    UPDATE public.rate_limits
    SET request_count = 1, window_start = now()
    WHERE user_id = _user_id AND endpoint = _endpoint;
    
    RETURN jsonb_build_object(
      'allowed', true,
      'remaining', _max_requests - 1,
      'reset_at', now() + (_window_minutes || ' minutes')::interval
    );
  END IF;
  
  -- Check if limit exceeded
  IF current_count >= _max_requests THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'reset_at', window_start + (_window_minutes || ' minutes')::interval
    );
  END IF;
  
  -- Increment counter
  UPDATE public.rate_limits
  SET request_count = request_count + 1
  WHERE user_id = _user_id AND endpoint = _endpoint;
  
  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', _max_requests - (current_count + 1),
    'reset_at', window_start + (_window_minutes || ' minutes')::interval
  );
END;
$$;