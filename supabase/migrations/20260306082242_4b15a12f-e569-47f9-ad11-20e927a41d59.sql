
-- Add score and total columns to video_homework_submissions
ALTER TABLE public.video_homework_submissions 
  ADD COLUMN IF NOT EXISTS score integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS total integer DEFAULT NULL;

-- Create a trigger function to auto-award points when video homework is submitted with a score
CREATE OR REPLACE FUNCTION public.award_video_homework_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _points integer;
BEGIN
  -- Only award if score and total are set and total > 0
  IF NEW.score IS NOT NULL AND NEW.total IS NOT NULL AND NEW.total > 0 THEN
    -- Check if points already awarded for this submission
    IF NOT EXISTS (
      SELECT 1 FROM public.student_points 
      WHERE user_id = NEW.user_id 
        AND source_type = 'video_homework' 
        AND source_id = NEW.id
    ) THEN
      -- Calculate points: 5 to 15 based on percentage
      _points := GREATEST(5, LEAST(15, ROUND((NEW.score::numeric / NEW.total) * 15)));
      
      INSERT INTO public.student_points (user_id, points, reason, source_type, source_id)
      VALUES (NEW.user_id, _points, 'واجب فيديو - ' || NEW.score || '/' || NEW.total, 'video_homework', NEW.id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_award_video_homework_points ON public.video_homework_submissions;
CREATE TRIGGER trg_award_video_homework_points
  AFTER INSERT ON public.video_homework_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.award_video_homework_points();
