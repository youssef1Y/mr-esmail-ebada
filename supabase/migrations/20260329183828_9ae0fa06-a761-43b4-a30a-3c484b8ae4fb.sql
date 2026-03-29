ALTER TABLE public.question_bank
ADD COLUMN IF NOT EXISTS video_id uuid;

CREATE INDEX IF NOT EXISTS idx_question_bank_video_id
ON public.question_bank(video_id);

ALTER TABLE public.question_bank
ADD CONSTRAINT question_bank_video_id_fkey
FOREIGN KEY (video_id) REFERENCES public.videos(id)
ON DELETE SET NULL;