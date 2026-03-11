
-- Create a function to delete auth user (admin only, security definer)
CREATE OR REPLACE FUNCTION public.admin_delete_auth_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete from auth.users using Supabase's built-in approach
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
