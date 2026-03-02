
CREATE OR REPLACE FUNCTION public.get_master_user()
RETURNS TABLE(user_id uuid, nome text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.nome
  FROM public.profiles p
  WHERE p.role = 'master'
  LIMIT 1
$$;
