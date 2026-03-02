
-- Create student_notifications table for personal notifications
CREATE TABLE public.student_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.student_notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.student_notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can insert notifications for any user
CREATE POLICY "Admins can insert notifications"
ON public.student_notifications
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications"
ON public.student_notifications
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update expire_subscriptions function to also create expiry notifications
CREATE OR REPLACE FUNCTION public.expire_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert expiry notifications before updating
  INSERT INTO public.student_notifications (user_id, title, body, type)
  SELECT user_id, 'انتهاء الاشتراك', 'انتهى اشتراكك الشهري في المنصة. يمكنك تجديد الاشتراك للاستمرار في الوصول للمحتوى التعليمي.', 'subscription_expired'
  FROM public.profiles
  WHERE is_subscribed = true
    AND subscription_expires_at IS NOT NULL
    AND subscription_expires_at <= now();

  -- Then expire the subscriptions
  UPDATE public.profiles
  SET is_subscribed = false, subscription_price = 0, subscription_expires_at = NULL
  WHERE is_subscribed = true
    AND subscription_expires_at IS NOT NULL
    AND subscription_expires_at <= now();
END;
$function$;
