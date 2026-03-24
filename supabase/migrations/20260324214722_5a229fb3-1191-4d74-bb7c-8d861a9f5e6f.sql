
CREATE OR REPLACE FUNCTION public.claim_share_reward(p_user_id UUID, p_platform TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_already_claimed BOOLEAN;
  v_points INT := 10;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RETURN json_build_object('success', false, 'message', 'غير مصرح');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM share_rewards WHERE user_id = p_user_id AND share_date = CURRENT_DATE
  ) INTO v_already_claimed;

  IF v_already_claimed THEN
    RETURN json_build_object('success', false, 'message', 'already_claimed');
  END IF;

  INSERT INTO share_rewards (user_id, platform, points_earned, key_earned)
  VALUES (p_user_id, p_platform, v_points, true);

  INSERT INTO student_points (user_id, points, reason, source_type, source_id)
  VALUES (p_user_id, v_points, 'مكافأة مشاركة المنصة', 'share', NULL);

  UPDATE student_keys SET keys_count = keys_count + 1 WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    INSERT INTO student_keys (user_id, keys_count) VALUES (p_user_id, 1);
  END IF;

  RETURN json_build_object('success', true, 'points', v_points, 'message', 'تم الحصول على المكافأة!');
END;
$$;
