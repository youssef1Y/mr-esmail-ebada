CREATE TABLE public.chat_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  memory text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.chat_memory
  FOR ALL TO authenticated
  USING (false);

CREATE INDEX idx_chat_memory_user ON public.chat_memory(user_id);
