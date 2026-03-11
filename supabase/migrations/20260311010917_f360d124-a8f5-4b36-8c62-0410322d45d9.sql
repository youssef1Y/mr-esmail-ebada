
-- Drop the existing permissive user update policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Recreate with WITH CHECK that prevents modifying subscription fields
-- Users can only update: full_name, school, governorate, madhab, parent_phone
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE TO public
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND is_subscribed IS NOT DISTINCT FROM (SELECT p.is_subscribed FROM public.profiles p WHERE p.user_id = auth.uid())
  AND subscription_expires_at IS NOT DISTINCT FROM (SELECT p.subscription_expires_at FROM public.profiles p WHERE p.user_id = auth.uid())
  AND subscription_price IS NOT DISTINCT FROM (SELECT p.subscription_price FROM public.profiles p WHERE p.user_id = auth.uid())
  AND grade IS NOT DISTINCT FROM (SELECT p.grade FROM public.profiles p WHERE p.user_id = auth.uid())
  AND student_phone IS NOT DISTINCT FROM (SELECT p.student_phone FROM public.profiles p WHERE p.user_id = auth.uid())
);
