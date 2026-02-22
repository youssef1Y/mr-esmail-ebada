
-- Fix submissions bucket: make private
UPDATE storage.buckets SET public = false WHERE id = 'submissions';

-- Drop overly permissive SELECT policy
DROP POLICY IF EXISTS "Submissions are publicly accessible" ON storage.objects;

-- Add owner + admin SELECT policy
CREATE POLICY "Users and admins can view submissions"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'submissions' AND 
  (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'))
);

-- Add admin SELECT policy for subscription_requests
CREATE POLICY "Admins can view all requests"
ON public.subscription_requests FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Add admin UPDATE policy for subscription_requests
CREATE POLICY "Admins can update requests"
ON public.subscription_requests FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));
