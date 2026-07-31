DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS trips_score ON public.trips;
CREATE TRIGGER trips_score
  BEFORE INSERT OR UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.score_trip();

DROP TRIGGER IF EXISTS trips_sync_points ON public.trips;
CREATE TRIGGER trips_sync_points
  AFTER INSERT OR UPDATE OR DELETE ON public.trips
  FOR EACH STATEMENT EXECUTE FUNCTION public.sync_total_points();