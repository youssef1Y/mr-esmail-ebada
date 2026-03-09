
-- FIX 2: Create a SECURITY DEFINER function to serve video homework without correct answers
CREATE OR REPLACE FUNCTION public.get_video_homework_for_student(p_video_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _hw record;
  _stripped jsonb := '[]'::jsonb;
  _q jsonb;
BEGIN
  SELECT id, description, questions INTO _hw
  FROM public.video_homework
  WHERE video_id = p_video_id;

  IF _hw IS NULL THEN
    RETURN NULL;
  END IF;

  -- Strip correct answer from each question
  IF _hw.questions IS NOT NULL AND jsonb_array_length(_hw.questions) > 0 THEN
    FOR i IN 0..jsonb_array_length(_hw.questions) - 1 LOOP
      _q := _hw.questions->i;
      _stripped := _stripped || jsonb_build_object(
        'question', _q->>'question',
        'options', _q->'options'
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'id', _hw.id,
    'description', _hw.description,
    'questions', _stripped
  );
END;
$$;

-- FIX 3: Replace the overly permissive referral_codes SELECT policy
DROP POLICY IF EXISTS "Anyone can read referral codes" ON public.referral_codes;
CREATE POLICY "Users can read own referral codes"
  ON public.referral_codes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
