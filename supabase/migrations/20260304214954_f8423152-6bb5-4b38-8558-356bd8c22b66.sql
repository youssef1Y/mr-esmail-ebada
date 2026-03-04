
-- 1. Drop broad SELECT policies on exam_questions and question_bank
DROP POLICY IF EXISTS "Authenticated can view questions" ON public.exam_questions;
DROP POLICY IF EXISTS "Authenticated can view questions" ON public.question_bank;

-- 2. Add attempt_count column to password_reset_otps for brute-force protection
ALTER TABLE public.password_reset_otps ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0;

-- 3. Fix subscription bypass: replace videos SELECT policy with subscription-aware one
DROP POLICY IF EXISTS "Users can view published videos" ON public.videos;
CREATE POLICY "Users can view accessible videos"
  ON public.videos FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (
      (publish_at IS NULL OR publish_at <= now())
      AND (
        access_type = 'all'
        OR (
          access_type = 'subscribers_only'
          AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid()
              AND is_subscribed = true
          )
        )
      )
    )
  );

-- 4. Fix subscription bypass for exams too
DROP POLICY IF EXISTS "Authenticated can view exams" ON public.exams;
CREATE POLICY "Users can view accessible exams"
  ON public.exams FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR access_type = 'all'
    OR (
      access_type = 'subscribers_only'
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid()
          AND is_subscribed = true
      )
    )
  );

-- 5. Make videos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'videos';
DROP POLICY IF EXISTS "Anyone can view videos" ON storage.objects;
CREATE POLICY "Authenticated can view videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'videos' AND auth.role() = 'authenticated');
