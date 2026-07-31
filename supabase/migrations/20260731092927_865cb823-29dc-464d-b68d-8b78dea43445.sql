CREATE OR REPLACE FUNCTION public.score_trip()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  ok boolean := false;
BEGIN
  IF NEW.mode = 'walk' THEN
    ok := NEW.avg_speed_kmh >= 2 AND NEW.avg_speed_kmh <= 8;
  ELSIF NEW.mode = 'cycle' THEN
    ok := NEW.avg_speed_kmh >= 10 AND NEW.avg_speed_kmh <= 25;
  ELSIF NEW.mode IN ('bus','train') THEN
    ok := NEW.avg_speed_kmh > 8;
  ELSE
    ok := false;
  END IF;

  NEW.verified := ok;

  IF NEW.mode = 'car' THEN
    -- honest self-reported car trip: reduced penalty
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