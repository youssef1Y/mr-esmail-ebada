
-- Fix 1: Hide correct_answer from non-admin users
-- Create a secure function to fetch exam questions without correct_answer
CREATE OR REPLACE FUNCTION public.get_exam_questions(p_exam_id uuid)
RETURNS TABLE(id uuid, question_text text, question_type text, options jsonb, sort_order integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT eq.id, eq.question_text, eq.question_type, eq.options, eq.sort_order
  FROM public.exam_questions eq
  WHERE eq.exam_id = p_exam_id
  ORDER BY eq.sort_order ASC;
$$;

-- Drop the overly permissive SELECT policy that exposes correct_answer
DROP POLICY IF EXISTS "Authenticated can view questions" ON public.exam_questions;

-- Fix 3: Make receipts bucket private
UPDATE storage.buckets SET public = false WHERE id = 'receipts';

-- Drop existing public read policy
DROP POLICY IF EXISTS "Receipts are publicly readable" ON storage.objects;

-- Create restricted read policy (owner + admin only)
CREATE POLICY "Users and admins can view receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'receipts' AND 
  (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'))
);
