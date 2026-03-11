
CREATE OR REPLACE FUNCTION public.cleanup_user_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id uuid := OLD.user_id;
  _attempt_ids uuid[];
BEGIN
  -- Get exam attempt IDs for cascade
  SELECT array_agg(id) INTO _attempt_ids FROM exam_attempts WHERE user_id = _user_id;
  
  -- Delete exam answers first (FK dependency)
  IF _attempt_ids IS NOT NULL AND array_length(_attempt_ids, 1) > 0 THEN
    DELETE FROM exam_answers WHERE attempt_id = ANY(_attempt_ids);
  END IF;

  -- Delete all user-related data
  DELETE FROM competition_entries WHERE user_id = _user_id;
  DELETE FROM exam_attempts WHERE user_id = _user_id;
  DELETE FROM homework_submissions WHERE user_id = _user_id;
  DELETE FROM video_homework_submissions WHERE user_id = _user_id;
  DELETE FROM video_comments WHERE user_id = _user_id;
  DELETE FROM video_views WHERE user_id = _user_id;
  DELETE FROM student_points WHERE user_id = _user_id;
  DELETE FROM student_keys WHERE user_id = _user_id;
  DELETE FROM student_notifications WHERE user_id = _user_id;
  DELETE FROM push_subscriptions WHERE user_id = _user_id;
  DELETE FROM subscription_requests WHERE user_id = _user_id;
  DELETE FROM referral_codes WHERE user_id = _user_id;
  DELETE FROM referral_completions WHERE referrer_id = _user_id OR referred_user_id = _user_id;
  DELETE FROM messages WHERE user_id = _user_id;
  DELETE FROM user_roles WHERE user_id = _user_id;

  RETURN OLD;
END;
$$;

CREATE TRIGGER trigger_cleanup_user_data
  BEFORE DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_user_data();
