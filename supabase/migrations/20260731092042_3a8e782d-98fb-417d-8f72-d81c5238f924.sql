DROP TRIGGER IF EXISTS trips_sync_points ON public.trips;
CREATE TRIGGER trips_sync_points
  AFTER INSERT OR UPDATE OR DELETE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.sync_total_points();