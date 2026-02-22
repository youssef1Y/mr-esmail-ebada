-- Allow admins to update exam_answers (for grading essay questions)
CREATE POLICY "Admins can update answers"
ON public.exam_answers
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update exam_attempts (for updating total score after grading essays)
CREATE POLICY "Admins can update attempts"
ON public.exam_attempts
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));
