CREATE TABLE public.food_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  tier SMALLINT NOT NULL CHECK (tier BETWEEN 1 AND 4),
  note TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.food_logs TO authenticated;
GRANT ALL ON public.food_logs TO service_role;

ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own food logs"
ON public.food_logs FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.score_food()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.points := CASE NEW.tier
    WHEN 4 THEN 14
    WHEN 3 THEN 9
    WHEN 2 THEN 4
    ELSE -4
  END;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.score_food() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER food_logs_score
BEFORE INSERT OR UPDATE ON public.food_logs
FOR EACH ROW EXECUTE FUNCTION public.score_food();

CREATE OR REPLACE FUNCTION public.sync_food_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := COALESCE(NEW.user_id, OLD.user_id);
BEGIN
  UPDATE public.profiles p
  SET total_points =
    COALESCE((SELECT SUM(points) FROM public.trips WHERE user_id = uid), 0)
    + COALESCE((SELECT SUM(points) FROM public.food_logs WHERE user_id = uid), 0)
  WHERE p.id = uid;
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_food_points() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER food_logs_sync_points
AFTER INSERT OR UPDATE OR DELETE ON public.food_logs
FOR EACH ROW EXECUTE FUNCTION public.sync_food_points();