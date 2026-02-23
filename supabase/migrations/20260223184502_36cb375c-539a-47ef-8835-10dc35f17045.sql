
-- Add subscription expiry column
ALTER TABLE public.profiles ADD COLUMN subscription_expires_at timestamp with time zone DEFAULT NULL;

-- Create function to auto-expire subscriptions
CREATE OR REPLACE FUNCTION public.expire_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET is_subscribed = false, subscription_price = 0, subscription_expires_at = NULL
  WHERE is_subscribed = true
    AND subscription_expires_at IS NOT NULL
    AND subscription_expires_at <= now();
END;
$$;
