DROP POLICY IF EXISTS "Only Master can insert prospects" ON public.prospects;
CREATE POLICY "Gestors can insert prospects" ON public.prospects
  FOR INSERT TO authenticated
  WITH CHECK (is_gestor(auth.uid()));

DROP POLICY IF EXISTS "Masters can insert import logs" ON public.prospect_import_logs;
CREATE POLICY "Gestors can insert import logs" ON public.prospect_import_logs
  FOR INSERT
  WITH CHECK (is_gestor(auth.uid()));

DROP POLICY IF EXISTS "Masters can view import logs" ON public.prospect_import_logs;
CREATE POLICY "Gestors can view import logs" ON public.prospect_import_logs
  FOR SELECT
  USING (is_gestor(auth.uid()));