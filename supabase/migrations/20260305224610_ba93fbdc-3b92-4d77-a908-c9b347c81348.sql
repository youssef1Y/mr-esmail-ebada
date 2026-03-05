
-- Video homework: teacher attaches homework to a video
CREATE TABLE public.video_homework (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL UNIQUE,
  description text,
  questions jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.video_homework ENABLE ROW LEVEL SECURITY;

-- Admins can manage
CREATE POLICY "Admins can manage video homework"
  ON public.video_homework FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can view
CREATE POLICY "Authenticated can view video homework"
  ON public.video_homework FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Video homework submissions
CREATE TABLE public.video_homework_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id uuid REFERENCES public.video_homework(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  answers jsonb DEFAULT '[]'::jsonb,
  image_urls text[] DEFAULT '{}'::text[],
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(homework_id, user_id)
);

ALTER TABLE public.video_homework_submissions ENABLE ROW LEVEL SECURITY;

-- Users can insert own submissions
CREATE POLICY "Users can insert own submissions"
  ON public.video_homework_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view own submissions
CREATE POLICY "Users can view own submissions"
  ON public.video_homework_submissions FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all submissions
CREATE POLICY "Admins can view all video hw submissions"
  ON public.video_homework_submissions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete submissions
CREATE POLICY "Admins can delete video hw submissions"
  ON public.video_homework_submissions FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));
