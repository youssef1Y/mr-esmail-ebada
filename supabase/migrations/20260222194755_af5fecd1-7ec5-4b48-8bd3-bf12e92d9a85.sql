
-- Create secure function for practice questions (without correct_answer)
CREATE OR REPLACE FUNCTION public.get_practice_questions(p_grade text, p_subject text)
RETURNS TABLE(id uuid, question_text text, question_type text, options jsonb, grade text, subject text, lesson text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT qb.id, qb.question_text, qb.question_type, qb.options, qb.grade, qb.subject, qb.lesson
  FROM public.question_bank qb
  WHERE qb.grade = p_grade AND qb.subject = p_subject
  ORDER BY random();
$$;

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated can view questions" ON public.question_bank;
