ALTER TABLE public.videos ADD COLUMN access_type text NOT NULL DEFAULT 'all';
-- 'all' = available for everyone, 'subscribers_only' = subscribed students only