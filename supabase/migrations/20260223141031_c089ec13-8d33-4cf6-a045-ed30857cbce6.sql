
-- Messages table for student-admin communication
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL,
  is_admin_reply boolean NOT NULL DEFAULT false,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Students can view their own messages (both sent and admin replies)
CREATE POLICY "Users can view own messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = user_id);

-- Students can insert their own messages (not admin replies)
CREATE POLICY "Users can insert own messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_admin_reply = false);

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
  ON public.messages FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert replies
CREATE POLICY "Admins can insert replies"
  ON public.messages FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update messages (mark as read)
CREATE POLICY "Admins can update messages"
  ON public.messages FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can mark admin replies as read
CREATE POLICY "Users can update own message read status"
  ON public.messages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function for student ranking (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_student_rank(p_user_id uuid)
RETURNS TABLE(rank bigint, total_students bigint, total_points bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  WITH user_totals AS (
    SELECT sp.user_id, COALESCE(SUM(sp.points), 0) as pts
    FROM public.student_points sp
    GROUP BY sp.user_id
  ),
  ranked AS (
    SELECT user_id, pts, ROW_NUMBER() OVER (ORDER BY pts DESC) as rnk
    FROM user_totals
  )
  SELECT 
    COALESCE((SELECT rnk FROM ranked WHERE user_id = p_user_id), (SELECT COUNT(*) + 1 FROM user_totals))::bigint as rank,
    (SELECT COUNT(*) FROM user_totals)::bigint as total_students,
    COALESCE((SELECT pts FROM ranked WHERE user_id = p_user_id), 0)::bigint as total_points;
$$;
