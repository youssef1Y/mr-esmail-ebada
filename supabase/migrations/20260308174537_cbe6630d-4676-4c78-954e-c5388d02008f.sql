CREATE POLICY "Admins can delete homework submissions"
ON public.homework_submissions FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));