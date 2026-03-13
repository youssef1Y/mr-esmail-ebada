
CREATE TABLE public.parent_push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_phone TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(parent_phone, endpoint)
);

ALTER TABLE public.parent_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Only service role can access (via edge functions)
CREATE POLICY "Deny all direct access" ON public.parent_push_subscriptions FOR ALL TO public USING (false);
