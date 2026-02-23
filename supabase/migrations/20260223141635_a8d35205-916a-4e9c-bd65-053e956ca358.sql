
-- Add publish_at column for scheduled video publishing
ALTER TABLE public.videos ADD COLUMN publish_at timestamp with time zone DEFAULT NULL;

-- Update the SELECT policy to only show published videos to non-admins
DROP POLICY IF EXISTS "Subscribed users can view videos" ON public.videos;

CREATE POLICY "Users can view published videos"
  ON public.videos FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR publish_at IS NULL 
    OR publish_at <= now()
  );
