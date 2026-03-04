
-- Create news table for dynamic platform news
CREATE TABLE public.news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📢',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- Everyone can view news
CREATE POLICY "Anyone can view news" ON public.news FOR SELECT USING (true);

-- Admins can manage news
CREATE POLICY "Admins can manage news" ON public.news FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));
