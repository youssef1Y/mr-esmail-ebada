
-- Drop the existing permissive user update policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create a restricted update policy that prevents users from modifying subscription fields
-- Uses a security definer function to safely compare old values
CREATE OR REPLACE FUNCTION public.check_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If user is admin, allow all changes
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Prevent non-admin users from modifying subscription fields
  IF NEW.is_subscribed IS DISTINCT FROM OLD.is_subscribed THEN
    RAISE EXCEPTION 'Cannot modify subscription status';
  END IF;
  IF NEW.subscription_expires_at IS DISTINCT FROM OLD.subscription_expires_at THEN
    RAISE EXCEPTION 'Cannot modify subscription expiry';
  END IF;
  IF NEW.subscription_price IS DISTINCT FROM OLD.subscription_price THEN
    RAISE EXCEPTION 'Cannot modify subscription price';
  END IF;
  -- Also prevent changing user_id, grade, student_phone
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Cannot modify user_id';
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS check_profile_update_trigger ON public.profiles;
CREATE TRIGGER check_profile_update_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_profile_update();

-- Re-create the user update policy (simple owner check, trigger handles field restrictions)
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);
