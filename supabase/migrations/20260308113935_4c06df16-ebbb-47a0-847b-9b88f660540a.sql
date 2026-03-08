
-- Create a SECURITY DEFINER function to grade video homework server-side
CREATE OR REPLACE FUNCTION public.submit_video_homework(
  p_homework_id uuid,
  p_user_id uuid,
  p_answers jsonb,
  p_image_urls text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _questions jsonb;
  _score integer := 0;
  _total integer := 0;
  _answer jsonb;
  _correct integer;
  _selected integer;
  _graded_answers jsonb := '[]'::jsonb;
  _submission_id uuid;
  _existing_count integer;
BEGIN
  -- Verify user is submitting for themselves
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot submit homework for another user';
  END IF;

  -- Check if already submitted
  SELECT COUNT(*) INTO _existing_count
  FROM video_homework_submissions
  WHERE homework_id = p_homework_id AND user_id = p_user_id;
  
  IF _existing_count > 0 THEN
    RAISE EXCEPTION 'Already submitted this homework';
  END IF;

  -- Get the questions from video_homework
  SELECT questions INTO _questions
  FROM video_homework
  WHERE id = p_homework_id;

  IF _questions IS NULL OR jsonb_array_length(_questions) = 0 THEN
    -- No questions, just insert with images
    INSERT INTO video_homework_submissions (homework_id, user_id, answers, image_urls, score, total)
    VALUES (p_homework_id, p_user_id, p_answers, p_image_urls, NULL, NULL)
    RETURNING id INTO _submission_id;
    
    RETURN jsonb_build_object('id', _submission_id, 'score', NULL, 'total', NULL);
  END IF;

  _total := jsonb_array_length(_questions);

  -- Grade each answer
  FOR i IN 0..(_total - 1) LOOP
    _correct := (_questions->i->>'correct')::integer;
    _selected := -1;
    
    -- Find the student's answer for this question
    IF p_answers IS NOT NULL THEN
      FOR _answer IN SELECT * FROM jsonb_array_elements(p_answers) LOOP
        IF (_answer->>'questionIndex')::integer = i THEN
          _selected := (_answer->>'selectedOption')::integer;
          EXIT;
        END IF;
      END LOOP;
    END IF;

    IF _selected = _correct THEN
      _score := _score + 1;
    END IF;

    _graded_answers := _graded_answers || jsonb_build_object(
      'questionIndex', i,
      'selectedOption', _selected,
      'isCorrect', _selected = _correct
    );
  END LOOP;

  -- Insert with server-calculated score
  INSERT INTO video_homework_submissions (homework_id, user_id, answers, image_urls, score, total)
  VALUES (p_homework_id, p_user_id, _graded_answers, p_image_urls, _score, _total)
  RETURNING id INTO _submission_id;

  RETURN jsonb_build_object('id', _submission_id, 'score', _score, 'total', _total);
END;
$$;
