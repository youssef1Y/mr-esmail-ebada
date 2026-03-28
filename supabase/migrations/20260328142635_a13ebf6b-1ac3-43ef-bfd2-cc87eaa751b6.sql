
CREATE TABLE public.question_bank_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade text NOT NULL,
  subject text NOT NULL,
  title text NOT NULL,
  description text,
  pdf_url text,
  answer_key_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.question_bank_files ENABLE ROW LEVEL SECURITY;

-- Admins can manage
CREATE POLICY "Admins can manage question bank files" ON public.question_bank_files
  FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can view
CREATE POLICY "Authenticated can view question bank files" ON public.question_bank_files
  FOR SELECT TO authenticated
  USING (true);
