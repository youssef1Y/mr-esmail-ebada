
-- Parent accounts table
CREATE TABLE public.parent_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.parent_accounts ENABLE ROW LEVEL SECURITY;

-- Only allow reading via edge function (service role)
CREATE POLICY "Deny all direct access to parent_accounts"
ON public.parent_accounts
FOR ALL
USING (false);
