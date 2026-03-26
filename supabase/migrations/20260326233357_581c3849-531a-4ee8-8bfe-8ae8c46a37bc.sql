
-- 1. Deny UPDATE on user_roles for authenticated users
CREATE POLICY "Deny update on user_roles"
ON public.user_roles
FOR UPDATE TO authenticated
USING (false);

-- 2. Add explicit SELECT deny for non-admin on question_bank
-- First check: the admin ALL policy already covers admin SELECT.
-- We need a policy that denies non-admin SELECT.
-- Since there's already an ALL policy for admins, non-admin users have no SELECT policy = denied by default.
-- But the scanner flags it, so let's be explicit:
CREATE POLICY "Deny non-admin select on question_bank"
ON public.question_bank
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
