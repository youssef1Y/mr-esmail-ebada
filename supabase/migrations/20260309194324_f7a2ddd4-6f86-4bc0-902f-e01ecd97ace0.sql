
CREATE OR REPLACE FUNCTION public.get_competition_question(p_grade text, p_subject text)
RETURNS TABLE(question_text text, options jsonb, correct_answer text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT qb.question_text, qb.options, qb.correct_answer
  FROM public.question_bank qb
  WHERE qb.grade = p_grade AND qb.subject = p_subject
    AND qb.question_type = 'mcq'
    AND qb.correct_answer IS NOT NULL
    AND qb.options IS NOT NULL
  ORDER BY random()
  LIMIT 1;
$$;
