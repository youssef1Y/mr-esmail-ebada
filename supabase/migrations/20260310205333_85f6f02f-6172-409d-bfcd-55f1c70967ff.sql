ALTER TABLE public.weekly_competitions 
ADD COLUMN draw_date date,
ADD COLUMN draw_time time without time zone,
ADD COLUMN draw_type text NOT NULL DEFAULT 'manual';