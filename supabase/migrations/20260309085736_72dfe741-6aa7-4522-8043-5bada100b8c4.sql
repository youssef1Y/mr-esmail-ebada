
CREATE OR REPLACE FUNCTION public.give_first_key(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.student_keys (user_id, keys_count, first_key_given)
  VALUES (p_user_id, 1, true)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_or_create_referral_code(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _code text;
BEGIN
  SELECT code INTO _code FROM public.referral_codes WHERE user_id = p_user_id;
  IF _code IS NOT NULL THEN
    RETURN _code;
  END IF;
  _code := substr(md5(random()::text || p_user_id::text), 1, 8);
  INSERT INTO public.referral_codes (user_id, code) VALUES (p_user_id, _code);
  RETURN _code;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_referral(p_referral_code text, p_new_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _referrer_id uuid;
BEGIN
  SELECT user_id INTO _referrer_id FROM public.referral_codes WHERE code = p_referral_code;
  IF _referrer_id IS NULL THEN RETURN; END IF;
  IF _referrer_id = p_new_user_id THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM public.referral_completions WHERE referred_user_id = p_new_user_id) THEN
    RETURN;
  END IF;
  INSERT INTO public.referral_completions (referrer_id, referred_user_id) VALUES (_referrer_id, p_new_user_id);
  INSERT INTO public.student_keys (user_id, keys_count, first_key_given)
  VALUES (_referrer_id, 1, false)
  ON CONFLICT (user_id) DO UPDATE SET keys_count = student_keys.keys_count + 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.use_key(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _keys integer;
BEGIN
  SELECT keys_count INTO _keys FROM public.student_keys WHERE user_id = p_user_id;
  IF _keys IS NULL OR _keys <= 0 THEN
    RETURN false;
  END IF;
  UPDATE public.student_keys SET keys_count = keys_count - 1 WHERE user_id = p_user_id;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_today_competition_entry(p_user_id uuid, p_competition_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM public.competition_entries
  WHERE user_id = p_user_id
    AND competition_id = p_competition_id
    AND entry_date = CURRENT_DATE;
$$;
