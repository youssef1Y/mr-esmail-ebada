
-- Create video_comments table for student comments/questions on videos
CREATE TABLE public.video_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_reply BOOLEAN DEFAULT false,
  parent_id UUID REFERENCES public.video_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view comments"
  ON public.video_comments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their own comments"
  ON public.video_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.video_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Allow admins to delete any comment
CREATE POLICY "Admins can delete any comment"
  ON public.video_comments FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create video_views table for tracking views (admin stats)
CREATE TABLE public.video_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can insert views"
  ON public.video_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all views"
  ON public.video_views FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Index for faster queries
CREATE INDEX idx_video_comments_video_id ON public.video_comments(video_id);
CREATE INDEX idx_video_views_video_id ON public.video_views(video_id);
CREATE INDEX idx_video_views_viewed_at ON public.video_views(viewed_at);
