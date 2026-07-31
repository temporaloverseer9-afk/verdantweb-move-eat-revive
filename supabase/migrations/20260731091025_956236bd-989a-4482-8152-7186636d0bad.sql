REVOKE ALL ON FUNCTION public.score_trip() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_total_points() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.weekly_leaderboard() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.weekly_leaderboard() TO authenticated;