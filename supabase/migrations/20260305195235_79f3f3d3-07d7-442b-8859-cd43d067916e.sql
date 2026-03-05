
DROP POLICY IF EXISTS "Users can update own message read status" ON public.messages;
CREATE POLICY "Users can update own message read status"
  ON public.messages FOR UPDATE
  USING (auth.uid() = user_id AND is_admin_reply = false)
  WITH CHECK (auth.uid() = user_id AND is_admin_reply = false);
