-- Allow students to delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON public.student_notifications
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);