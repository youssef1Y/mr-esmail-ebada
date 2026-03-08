
-- Create parent_sessions table for secure token-based auth
CREATE TABLE public.parent_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES public.parent_accounts(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.parent_sessions ENABLE ROW LEVEL SECURITY;

-- Deny all direct access (only edge functions with service role can access)
CREATE POLICY "Deny all select" ON public.parent_sessions FOR SELECT USING (false);
CREATE POLICY "Deny all insert" ON public.parent_sessions FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny all update" ON public.parent_sessions FOR UPDATE USING (false);
CREATE POLICY "Deny all delete" ON public.parent_sessions FOR DELETE USING (false);

-- Add index for fast token lookups
CREATE INDEX idx_parent_sessions_token ON public.parent_sessions(token);

-- Add index for cleanup of expired sessions
CREATE INDEX idx_parent_sessions_expires ON public.parent_sessions(expires_at);

-- Add hash_version column to parent_accounts for bcrypt migration
ALTER TABLE public.parent_accounts ADD COLUMN hash_version integer NOT NULL DEFAULT 1;

-- Create table for IP rate limiting on OTP
CREATE TABLE public.otp_ip_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.otp_ip_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny all select" ON public.otp_ip_tracking FOR SELECT USING (false);
CREATE POLICY "Deny all insert" ON public.otp_ip_tracking FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny all update" ON public.otp_ip_tracking FOR UPDATE USING (false);
CREATE POLICY "Deny all delete" ON public.otp_ip_tracking FOR DELETE USING (false);

CREATE INDEX idx_otp_ip_tracking_ip_created ON public.otp_ip_tracking(ip_address, created_at);
