
-- Fix competition_entries RLS: change from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Users can view own entries" ON public.competition_entries;
DROP POLICY IF EXISTS "Admins can view all entries" ON public.competition_entries;
DROP POLICY IF EXISTS "Users can insert own entries" ON public.competition_entries;

CREATE POLICY "Users can view own entries" ON public.competition_entries
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all entries" ON public.competition_entries
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own entries" ON public.competition_entries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Fix weekly_competitions RLS: ensure permissive
DROP POLICY IF EXISTS "Anyone authenticated can view competitions" ON public.weekly_competitions;
DROP POLICY IF EXISTS "Admins can manage competitions" ON public.weekly_competitions;

CREATE POLICY "Anyone authenticated can view competitions" ON public.weekly_competitions
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage competitions" ON public.weekly_competitions
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix student_keys RLS: ensure permissive
DROP POLICY IF EXISTS "Users can view own keys" ON public.student_keys;
DROP POLICY IF EXISTS "Admins can view all keys" ON public.student_keys;
DROP POLICY IF EXISTS "Admins can insert keys" ON public.student_keys;
DROP POLICY IF EXISTS "Admins can update keys" ON public.student_keys;

CREATE POLICY "Users can view own keys" ON public.student_keys
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all keys" ON public.student_keys
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert keys" ON public.student_keys
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update keys" ON public.student_keys
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix referral_codes RLS
DROP POLICY IF EXISTS "Anyone can read referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Users can view own referral code" ON public.referral_codes;
DROP POLICY IF EXISTS "Admins can manage referral codes" ON public.referral_codes;

CREATE POLICY "Anyone can read referral codes" ON public.referral_codes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage referral codes" ON public.referral_codes
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix referral_completions RLS
DROP POLICY IF EXISTS "Users can view own referrals" ON public.referral_completions;
DROP POLICY IF EXISTS "Admins can view all referrals" ON public.referral_completions;

CREATE POLICY "Users can view own referrals" ON public.referral_completions
  FOR SELECT TO authenticated USING (auth.uid() = referrer_id);

CREATE POLICY "Admins can view all referrals" ON public.referral_completions
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
