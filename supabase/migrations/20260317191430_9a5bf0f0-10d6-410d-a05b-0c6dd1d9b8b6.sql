
-- Add pdf_url to exams and homework tables
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS pdf_url text;
ALTER TABLE public.homework ADD COLUMN IF NOT EXISTS pdf_url text;

-- Add total column to homework_submissions for free-form grading
ALTER TABLE public.homework_submissions ADD COLUMN IF NOT EXISTS total integer;

-- Create documents storage bucket for admin PDF uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true) ON CONFLICT (id) DO NOTHING;

-- Storage RLS for documents bucket
CREATE POLICY "Anyone can view documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
CREATE POLICY "Admins can upload documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete documents" ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'::public.app_role));
