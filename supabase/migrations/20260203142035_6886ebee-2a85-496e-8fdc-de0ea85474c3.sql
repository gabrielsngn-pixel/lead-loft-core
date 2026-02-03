-- Create DELETE policy for profiles table to allow Master users to delete profiles
CREATE POLICY "Master users can delete profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (public.is_master(auth.uid()));