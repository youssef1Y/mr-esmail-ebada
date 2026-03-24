
-- Table to track daily share rewards (max 1 reward per day)
CREATE TABLE public.share_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  shared_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  share_date DATE NOT NULL DEFAULT CURRENT_DATE,
  platform TEXT NOT NULL DEFAULT 'link',
  points_earned INT NOT NULL DEFAULT 5,
  key_earned BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (user_id, share_date)
);

-- Enable RLS
ALTER TABLE public.share_rewards ENABLE ROW LEVEL SECURITY;

-- Students can view their own shares
CREATE POLICY "Users can view own shares" ON public.share_rewards
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Students can insert their own shares
CREATE POLICY "Users can insert own shares" ON public.share_rewards
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admin can view all
CREATE POLICY "Admins can view all shares" ON public.share_rewards
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RPC to claim share reward (returns success/already_claimed)
CREATE OR REPLACE FUNCTION public.claim_share_reward(p_user_id UUID, p_platform TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_already_claimed BOOLEAN;
  v_points INT := 5;
BEGIN
  -- Check auth
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RETURN json_build_object('success', false, 'message', 'غير مصرح');
  END IF;

  -- Check if already claimed today
  SELECT EXISTS (
    SELECT 1 FROM share_rewards WHERE user_id = p_user_id AND share_date = CURRENT_DATE
  ) INTO v_already_claimed;

  IF v_already_claimed THEN
    RETURN json_build_object('success', false, 'message', 'already_claimed');
  END IF;

  -- Insert share record
  INSERT INTO share_rewards (user_id, platform, points_earned, key_earned)
  VALUES (p_user_id, p_platform, v_points, true);

  -- Add points
  INSERT INTO student_points (user_id, points, reason, source_type, source_id)
  VALUES (p_user_id, v_points, 'مكافأة مشاركة المنصة', 'share', NULL);

  -- Add key
  UPDATE student_keys SET keys_count = keys_count + 1 WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    INSERT INTO student_keys (user_id, keys_count) VALUES (p_user_id, 1);
  END IF;

  RETURN json_build_object('success', true, 'points', v_points, 'message', 'تم الحصول على المكافأة!');
END;
$$;
