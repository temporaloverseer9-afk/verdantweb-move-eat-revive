CREATE TYPE public.transit_mode AS ENUM ('walk','cycle','bus','train','car');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  total_points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by signed-in users"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode public.transit_mode NOT NULL,
  distance_km numeric(8,2) NOT NULL CHECK (distance_km > 0 AND distance_km <= 500),
  avg_speed_kmh numeric(6,2) NOT NULL CHECK (avg_speed_kmh >= 0 AND avg_speed_kmh <= 400),
  verified boolean NOT NULL DEFAULT false,
  points integer NOT NULL DEFAULT 0,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX trips_user_time_idx ON public.trips (user_id, occurred_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;
GRANT ALL ON public.trips TO service_role;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own trips"
  ON public.trips FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Scoring + verification engine
CREATE OR REPLACE FUNCTION public.score_trip()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
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

  IF NOT ok THEN
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
$$;

CREATE TRIGGER trips_score BEFORE INSERT OR UPDATE ON public.trips
FOR EACH ROW EXECUTE FUNCTION public.score_trip();

-- Keep profile total points in sync
CREATE OR REPLACE FUNCTION public.sync_total_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := COALESCE(NEW.user_id, OLD.user_id);
BEGIN
  UPDATE public.profiles p
  SET total_points = COALESCE((SELECT SUM(t.points) FROM public.trips t WHERE t.user_id = uid), 0)
  WHERE p.id = uid;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trips_sync_points AFTER INSERT OR UPDATE OR DELETE ON public.trips
FOR EACH ROW EXECUTE FUNCTION public.sync_total_points();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base text;
  candidate text;
  n int := 0;
BEGIN
  base := regexp_replace(lower(COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1), 'eco_user')), '[^a-z0-9_]', '', 'g');
  IF base = '' THEN base := 'eco_user'; END IF;
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = candidate) LOOP
    n := n + 1;
    candidate := base || n::text;
  END LOOP;
  INSERT INTO public.profiles (id, username) VALUES (NEW.id, candidate);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Weekly leaderboard
CREATE OR REPLACE FUNCTION public.weekly_leaderboard()
RETURNS TABLE (user_id uuid, username text, weekly_points bigint, total_points integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id,
         p.username,
         COALESCE(SUM(t.points) FILTER (WHERE t.occurred_at >= date_trunc('week', now())), 0)::bigint,
         p.total_points
  FROM public.profiles p
  LEFT JOIN public.trips t ON t.user_id = p.id
  GROUP BY p.id, p.username, p.total_points
  ORDER BY 3 DESC, p.total_points DESC
  LIMIT 100;
$$;

GRANT EXECUTE ON FUNCTION public.weekly_leaderboard() TO authenticated;