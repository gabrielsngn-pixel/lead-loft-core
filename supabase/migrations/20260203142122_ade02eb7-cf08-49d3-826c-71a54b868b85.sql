-- Create DELETE policy for access_requests table to allow Master users to delete access requests
CREATE POLICY "Master users can delete access requests"
ON public.access_requests FOR DELETE
TO authenticated
USING (public.is_master(auth.uid()));