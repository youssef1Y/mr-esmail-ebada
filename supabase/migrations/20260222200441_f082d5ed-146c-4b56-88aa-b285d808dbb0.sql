-- Remove the policy that allows users to insert their own points
DROP POLICY IF EXISTS "System can insert points" ON public.student_points;