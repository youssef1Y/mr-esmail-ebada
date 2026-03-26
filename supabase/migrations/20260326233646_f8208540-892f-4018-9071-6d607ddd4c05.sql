
-- Block anon access to question_bank
CREATE POLICY "Deny anon select on question_bank"
ON public.question_bank
FOR SELECT TO anon
USING (false);
