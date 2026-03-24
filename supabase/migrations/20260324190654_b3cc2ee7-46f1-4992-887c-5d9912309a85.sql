-- 1. Allow students to read exam questions (but app queries strip correct_answer)
CREATE POLICY "Students can select exam questions"
ON public.exam_questions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.exams e
    WHERE e.id = exam_questions.exam_id
  )
);

-- 2. Allow users to read their own role
CREATE POLICY "Users can read own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);