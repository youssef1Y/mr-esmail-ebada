
-- Create exams table
CREATE TABLE public.exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  grade TEXT NOT NULL,
  subject TEXT NOT NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL,
  access_type TEXT NOT NULL DEFAULT 'all', -- 'all' or 'subscribers_only'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage exams" ON public.exams FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can view exams" ON public.exams FOR SELECT USING (true);

-- Create exam_questions table
CREATE TABLE public.exam_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'mcq', -- 'mcq' or 'essay'
  options JSONB, -- for mcq: ["option1", "option2", "option3", "option4"]
  correct_answer TEXT, -- for mcq: the correct option text
  sort_order INTEGER DEFAULT 0
);

ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage questions" ON public.exam_questions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can view questions" ON public.exam_questions FOR SELECT USING (true);

-- Create exam_attempts table
CREATE TABLE public.exam_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  score INTEGER DEFAULT 0,
  total INTEGER DEFAULT 0,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own attempts" ON public.exam_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own attempts" ON public.exam_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all attempts" ON public.exam_attempts FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Create exam_answers table
CREATE TABLE public.exam_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE,
  answer TEXT,
  is_correct BOOLEAN DEFAULT false
);

ALTER TABLE public.exam_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own answers" ON public.exam_answers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.exam_attempts WHERE id = attempt_id AND user_id = auth.uid())
);
CREATE POLICY "Users can view own answers" ON public.exam_answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.exam_attempts WHERE id = attempt_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can view all answers" ON public.exam_answers FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
