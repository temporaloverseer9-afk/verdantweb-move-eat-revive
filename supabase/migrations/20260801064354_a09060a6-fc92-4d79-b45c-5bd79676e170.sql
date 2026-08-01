ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS gps_path jsonb,
  ADD COLUMN IF NOT EXISTS duration_s integer,
  ADD COLUMN IF NOT EXISTS ping_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_speed_kmh numeric,
  ADD COLUMN IF NOT EXISTS accuracy_m numeric;

CREATE OR REPLACE FUNCTION public.score_trip()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  ok boolean := false;
  has_gps boolean;
BEGIN
  -- Anti-cheat: a trip only counts as verified when it carries a real GPS
  -- trace with enough sampled pings over enough elapsed time.
  has_gps := NEW.gps_path IS NOT NULL
             AND jsonb_typeof(NEW.gps_path) = 'array'
             AND jsonb_array_length(NEW.gps_path) >= 3
             AND COALESCE(NEW.duration_s, 0) >= 60;

  IF NEW.mode = 'walk' THEN
    ok := NEW.avg_speed_kmh >= 2 AND NEW.avg_speed_kmh <= 8;
  ELSIF NEW.mode = 'cycle' THEN
    ok := NEW.avg_speed_kmh >= 10 AND NEW.avg_speed_kmh <= 25;
  ELSIF NEW.mode IN ('bus','train') THEN
    ok := NEW.avg_speed_kmh > 8;
  ELSE
    ok := false;
  END IF;

  -- Implausible bursts (teleporting / spoofed jumps) fail verification.
  IF NEW.max_speed_kmh IS NOT NULL THEN
    IF NEW.mode = 'walk' AND NEW.max_speed_kmh > 15 THEN ok := false; END IF;
    IF NEW.mode = 'cycle' AND NEW.max_speed_kmh > 45 THEN ok := false; END IF;
    IF NEW.max_speed_kmh > 300 THEN ok := false; END IF;
  END IF;

  ok := ok AND has_gps;
  NEW.verified := ok;

  IF NEW.mode = 'car' THEN
    NEW.points := -CEIL(NEW.distance_km / 2.0)::int;
  ELSIF NOT ok THEN
    NEW.points := -CEIL(NEW.distance_km)::int;
  ELSIF NEW.mode = 'walk' THEN
    NEW.points := ROUND(NEW.distance_km * 5)::int;
  ELSIF NEW.mode = 'cycle' THEN
    NEW.points := ROUND(NEW.distance_km * 3)::int;
  ELSE
    NEW.points := ROUND(NEW.distance_km * 2)::int;
  END IF;

  RETURN NEW;
END;
$function$;