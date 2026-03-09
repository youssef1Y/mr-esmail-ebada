
-- Student keys table
CREATE TABLE IF NOT EXISTS public.student_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  keys_count integer NOT NULL DEFAULT 0,
  first_key_given boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.student_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own keys" ON public.student_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all keys" ON public.student_keys FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update keys" ON public.student_keys FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert keys" ON public.student_keys FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Referral codes table
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own referral code" ON public.referral_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can read referral codes" ON public.referral_codes FOR SELECT USING (true);
CREATE POLICY "Admins can manage referral codes" ON public.referral_codes FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Referral completions table
CREATE TABLE IF NOT EXISTS public.referral_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_user_id uuid NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.referral_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own referrals" ON public.referral_completions FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "Admins can view all referrals" ON public.referral_completions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Weekly competitions table
CREATE TABLE IF NOT EXISTS public.weekly_competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  week_start date NOT NULL,
  week_end date NOT NULL,
  status text NOT NULL DEFAULT 'active',
  winner_id uuid,
  winner_name text,
  prize_description text DEFAULT 'شهادة تقدير',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.weekly_competitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view competitions" ON public.weekly_competitions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage competitions" ON public.weekly_competitions FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Competition entries table
CREATE TABLE IF NOT EXISTS public.competition_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  competition_id uuid NOT NULL REFERENCES public.weekly_competitions(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  options jsonb,
  correct_answer text,
  selected_answer text,
  is_correct boolean NOT NULL DEFAULT false,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, competition_id, entry_date)
);
ALTER TABLE public.competition_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own entries" ON public.competition_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own entries" ON public.competition_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all entries" ON public.competition_entries FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
