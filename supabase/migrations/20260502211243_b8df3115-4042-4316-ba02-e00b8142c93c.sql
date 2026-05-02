CREATE POLICY "students_can_insert_own_notifications"
  ON public.student_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());