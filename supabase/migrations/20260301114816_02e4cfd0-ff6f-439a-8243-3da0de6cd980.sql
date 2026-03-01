-- Add deny-all RLS policies to password_reset_otps
-- This table should ONLY be accessed by edge functions using service role key
CREATE POLICY "Deny all select" ON public.password_reset_otps FOR SELECT USING (false);
CREATE POLICY "Deny all insert" ON public.password_reset_otps FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny all update" ON public.password_reset_otps FOR UPDATE USING (false);
CREATE POLICY "Deny all delete" ON public.password_reset_otps FOR DELETE USING (false);