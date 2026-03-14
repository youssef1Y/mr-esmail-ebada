CREATE TABLE public.video_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL UNIQUE,
  summary text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.video_summaries ENABLE ROW LEVEL SECURITY;

-- Admins can manage
CREATE POLICY "Admins can manage video summaries"
ON public.video_summaries FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can read
CREATE POLICY "Authenticated can view video summaries"
ON public.video_summaries FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);