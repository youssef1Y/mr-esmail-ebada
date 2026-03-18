-- Add homework_type and answer_key columns to homework table
ALTER TABLE public.homework ADD COLUMN IF NOT EXISTS homework_type text NOT NULL DEFAULT 'regular';
ALTER TABLE public.homework ADD COLUMN IF NOT EXISTS book_name text;
ALTER TABLE public.homework ADD COLUMN IF NOT EXISTS page_from integer;
ALTER TABLE public.homework ADD COLUMN IF NOT EXISTS page_to integer;
ALTER TABLE public.homework ADD COLUMN IF NOT EXISTS lesson_number text;
ALTER TABLE public.homework ADD COLUMN IF NOT EXISTS answer_key_url text;

-- Add answer_key_url to exams for admin-uploaded answer keys
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS answer_key_url text;

-- Add ai_score and ai_feedback to homework_submissions for auto-grading
ALTER TABLE public.homework_submissions ADD COLUMN IF NOT EXISTS ai_score numeric;
ALTER TABLE public.homework_submissions ADD COLUMN IF NOT EXISTS ai_feedback text;

-- Add ai_feedback to exam_attempts for auto-grading  
ALTER TABLE public.exam_attempts ADD COLUMN IF NOT EXISTS ai_feedback text;