DROP FUNCTION IF EXISTS public.get_practice_questions(text, text);

CREATE FUNCTION public.get_practice_questions(p_grade text, p_subject text)
RETURNS TABLE(id uuid, question_text text, question_type text, options jsonb, correct_answer text, grade text, subject text, lesson text, video_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT qb.id, qb.question_text, qb.question_type, qb.options, qb.correct_answer, qb.grade, qb.subject, qb.lesson, qb.video_id
  FROM public.question_bank qb
  WHERE qb.grade = p_grade AND qb.subject = p_subject
  ORDER BY random();
$function$;