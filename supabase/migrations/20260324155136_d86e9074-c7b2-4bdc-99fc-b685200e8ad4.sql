
-- App settings table for global configuration like current term
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage settings
CREATE POLICY "Admins can manage settings" ON public.app_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Everyone can read settings
CREATE POLICY "Anyone authenticated can read settings" ON public.app_settings
  FOR SELECT TO authenticated
  USING (true);

-- Insert default term
INSERT INTO public.app_settings (key, value) VALUES ('current_term', '1');

-- Add term column to videos, homework, exams
ALTER TABLE public.videos ADD COLUMN term integer NOT NULL DEFAULT 1;
ALTER TABLE public.homework ADD COLUMN term integer NOT NULL DEFAULT 1;
ALTER TABLE public.exams ADD COLUMN term integer NOT NULL DEFAULT 1;
