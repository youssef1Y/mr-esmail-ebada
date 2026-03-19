CREATE OR REPLACE FUNCTION public.award_video_homework_points()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.score IS NOT NULL AND NEW.total IS NOT NULL AND NEW.total > 0 THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.student_points 
      WHERE user_id = NEW.user_id 
        AND source_type = 'video_homework' 
        AND source_id = NEW.id
    ) THEN
      -- Points = score directly (e.g. 8/10 = 8 points)
      IF NEW.score > 0 THEN
        INSERT INTO public.student_points (user_id, points, reason, source_type, source_id)
        VALUES (NEW.user_id, NEW.score, 'واجب فيديو - ' || NEW.score || '/' || NEW.total, 'video_homework', NEW.id);
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;