
-- Create parent_notifications table
CREATE TABLE public.parent_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_phone TEXT NOT NULL,
  student_user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.parent_notifications ENABLE ROW LEVEL SECURITY;

-- Only admin can insert/manage
CREATE POLICY "Admins can manage parent notifications"
  ON public.parent_notifications
  FOR ALL
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- No direct access for regular users (accessed via edge function)
CREATE POLICY "Deny all non-admin access"
  ON public.parent_notifications
  FOR SELECT
  TO public
  USING (false);
