-- Fix is_gestor function to also return true for master users
CREATE OR REPLACE FUNCTION public.is_gestor(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = check_user_id AND (role = 'gestor' OR role = 'master')
  )
$$;