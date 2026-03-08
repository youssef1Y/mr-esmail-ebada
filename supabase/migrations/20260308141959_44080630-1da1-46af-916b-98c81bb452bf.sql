
CREATE TABLE public.schedule_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  event_time time,
  event_type text NOT NULL DEFAULT 'general',
  grade text NOT NULL,
  subject text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.schedule_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage schedule events"
ON public.schedule_events
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view schedule events"
ON public.schedule_events
FOR SELECT
USING (auth.uid() IS NOT NULL);
