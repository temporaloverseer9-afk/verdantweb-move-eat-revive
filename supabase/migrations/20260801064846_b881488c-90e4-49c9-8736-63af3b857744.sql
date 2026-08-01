CREATE OR REPLACE FUNCTION public.weekly_leaderboard()
 RETURNS TABLE(user_id uuid, username text, avatar text, weekly_points bigint, total_points integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.id,
         p.username,
         p.avatar,
         COALESCE(SUM(t.points) FILTER (WHERE t.occurred_at >= date_trunc('week', now())), 0)::bigint,
         p.total_points
  FROM public.profiles p
  LEFT JOIN public.trips t ON t.user_id = p.id
  WHERE auth.uid() IS NOT NULL
  GROUP BY p.id, p.username, p.avatar, p.total_points
  ORDER BY 4 DESC, p.total_points DESC
  LIMIT 100;
$function$;

CREATE OR REPLACE FUNCTION public.public_profile_stats(_user_id uuid)
 RETURNS TABLE(user_id uuid, username text, avatar text, total_points integer, weekly_points bigint, green_km numeric, trip_points bigint, trip_count bigint, food_points bigint, meal_count bigint, joined_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.id,
         p.username,
         p.avatar,
         p.total_points,
         COALESCE((SELECT SUM(t.points) FROM public.trips t
                    WHERE t.user_id = p.id AND t.occurred_at >= date_trunc('week', now())), 0)::bigint,
         COALESCE((SELECT SUM(t.distance_km) FROM public.trips t
                    WHERE t.user_id = p.id AND t.mode <> 'car' AND t.verified), 0)::numeric,
         COALESCE((SELECT SUM(t.points) FROM public.trips t WHERE t.user_id = p.id), 0)::bigint,
         COALESCE((SELECT COUNT(*) FROM public.trips t WHERE t.user_id = p.id), 0)::bigint,
         COALESCE((SELECT SUM(f.points) FROM public.food_logs f WHERE f.user_id = p.id), 0)::bigint,
         COALESCE((SELECT COUNT(*) FROM public.food_logs f WHERE f.user_id = p.id), 0)::bigint,
         p.created_at
  FROM public.profiles p
  WHERE p.id = _user_id
    AND auth.uid() IS NOT NULL;
$function$;

REVOKE ALL ON FUNCTION public.weekly_leaderboard() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.public_profile_stats(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.weekly_leaderboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.public_profile_stats(uuid) TO authenticated;