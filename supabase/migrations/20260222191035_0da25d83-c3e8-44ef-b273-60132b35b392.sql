
-- Homework table
CREATE TABLE public.homework (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  grade TEXT NOT NULL,
  subject TEXT NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage homework" ON public.homework FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can view homework" ON public.homework FOR SELECT USING (auth.uid() IS NOT NULL);

-- Homework submissions
CREATE TABLE public.homework_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  homework_id UUID NOT NULL REFERENCES public.homework(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT,
  image_urls TEXT[] DEFAULT '{}',
  score INTEGER,
  feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own submissions" ON public.homework_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own submissions" ON public.homework_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all submissions" ON public.homework_submissions FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update submissions" ON public.homework_submissions FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Student points
CREATE TABLE public.student_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  source_type TEXT NOT NULL, -- 'exam', 'homework', 'video_view'
  source_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.student_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own points" ON public.student_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all points" ON public.student_points FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert points" ON public.student_points FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "System can insert points" ON public.student_points FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Question bank
CREATE TABLE public.question_bank (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grade TEXT NOT NULL,
  subject TEXT NOT NULL,
  lesson TEXT,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'mcq',
  options JSONB,
  correct_answer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage question bank" ON public.question_bank FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can view questions" ON public.question_bank FOR SELECT USING (auth.uid() IS NOT NULL);

-- Add image_urls to exam_answers for image uploads in exams
ALTER TABLE public.exam_answers ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- Storage bucket for submissions (homework/exam images)
INSERT INTO storage.buckets (id, name, public) VALUES ('submissions', 'submissions', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own submissions" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'submissions' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Submissions are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'submissions');
