CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS questions_generated boolean NOT NULL DEFAULT false;