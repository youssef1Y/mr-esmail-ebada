
CREATE OR REPLACE FUNCTION public.award_video_view_points()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Award 1 point per unique video watched (only first view)
  IF NOT EXISTS (
    SELECT 1 FROM public.video_views 
    WHERE user_id = NEW.user_id 
      AND video_id = NEW.video_id
      AND id != NEW.id
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.student_points 
      WHERE user_id = NEW.user_id 
        AND source_type = 'video_view' 
        AND source_id = NEW.video_id
    ) THEN
      INSERT INTO public.student_points (user_id, points, reason, source_type, source_id)
      VALUES (NEW.user_id, 1, 'مشاهدة فيديو', 'video_view', NEW.video_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_award_video_view_points
  AFTER INSERT ON public.video_views
  FOR EACH ROW
  EXECUTE FUNCTION public.award_video_view_points();
