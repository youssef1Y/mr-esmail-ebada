
-- Create a SECURITY DEFINER RPC to get random exam questions for competitions
-- This returns correct_answer only through the RPC, not via direct table access
CREATE OR REPLACE FUNCTION public.get_competition_exam_questions(p_grade text, p_subject text)
RETURNS TABLE(question_text text, options jsonb, correct_answer text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT eq.question_text, eq.options, eq.correct_answer
  FROM public.exam_questions eq
  JOIN public.exams e ON e.id = eq.exam_id
  WHERE e.grade = p_grade AND e.subject = p_subject
    AND eq.question_type = 'mcq'
    AND eq.correct_answer IS NOT NULL
    AND eq.options IS NOT NULL
  ORDER BY random()
  LIMIT 10;
$$;

-- Drop the broad SELECT policy that exposes correct_answer
DROP POLICY IF EXISTS "Students can select exam questions" ON public.exam_questions;
