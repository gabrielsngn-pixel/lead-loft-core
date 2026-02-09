
-- Fix prospects UPDATE policy: drop restrictive, create permissive
DROP POLICY IF EXISTS "Approved users can update prospects" ON public.prospects;
CREATE POLICY "Approved users can update prospects"
ON public.prospects FOR UPDATE
TO authenticated
USING (is_approved(auth.uid()));

-- Fix prospects SELECT policy
DROP POLICY IF EXISTS "Approved users can view prospects" ON public.prospects;
CREATE POLICY "Approved users can view prospects"
ON public.prospects FOR SELECT
TO authenticated
USING (is_approved(auth.uid()));

-- Fix prospects DELETE policy
DROP POLICY IF EXISTS "Only Master can delete prospects" ON public.prospects;
CREATE POLICY "Only Master can delete prospects"
ON public.prospects FOR DELETE
TO authenticated
USING (is_master(auth.uid()));

-- Fix prospects INSERT policy
DROP POLICY IF EXISTS "Only Master can insert prospects" ON public.prospects;
CREATE POLICY "Only Master can insert prospects"
ON public.prospects FOR INSERT
TO authenticated
WITH CHECK (is_master(auth.uid()));

-- Fix leads UPDATE policy
DROP POLICY IF EXISTS "Approved users can update leads" ON public.leads;
CREATE POLICY "Approved users can update leads"
ON public.leads FOR UPDATE
TO authenticated
USING (is_approved(auth.uid()));

-- Fix leads SELECT policy
DROP POLICY IF EXISTS "Approved users can view leads" ON public.leads;
CREATE POLICY "Approved users can view leads"
ON public.leads FOR SELECT
TO authenticated
USING (is_approved(auth.uid()));

-- Fix leads INSERT policy
DROP POLICY IF EXISTS "Approved users can insert leads" ON public.leads;
CREATE POLICY "Approved users can insert leads"
ON public.leads FOR INSERT
TO authenticated
WITH CHECK (is_approved(auth.uid()));

-- Fix leads DELETE policy
DROP POLICY IF EXISTS "Approved users can delete leads" ON public.leads;
CREATE POLICY "Approved users can delete leads"
ON public.leads FOR DELETE
TO authenticated
USING (is_approved(auth.uid()));
