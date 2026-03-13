
-- Drop the current permissive SELECT policy
DROP POLICY IF EXISTS "Approved users can view prospects" ON public.prospects;

-- New SELECT policy: gestors/masters see all; consultors only see unassigned or their own
CREATE POLICY "Filtered prospect visibility" ON public.prospects
FOR SELECT TO authenticated
USING (
  is_gestor(auth.uid())
  OR (
    is_approved(auth.uid()) AND (
      consultor_responsavel_id IS NULL
      OR consultor_responsavel_id = auth.uid()
    )
  )
);
