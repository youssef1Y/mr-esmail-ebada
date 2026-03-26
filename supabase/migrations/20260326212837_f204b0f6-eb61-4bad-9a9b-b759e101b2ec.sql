
-- 1. Deny all inserts to user_roles for authenticated users
CREATE POLICY "Deny all inserts to user_roles"
ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (false);

-- 2. Deny all deletes to user_roles for authenticated users  
CREATE POLICY "Deny all deletes to user_roles"
ON public.user_roles
FOR DELETE TO authenticated
USING (false);

-- 3. Allow users to read their own video views
CREATE POLICY "Users can view own video views"
ON public.video_views
FOR SELECT TO authenticated
USING (auth.uid() = user_id);
