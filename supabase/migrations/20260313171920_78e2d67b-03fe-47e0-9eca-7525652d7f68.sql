
CREATE OR REPLACE FUNCTION public.get_approved_consultants()
RETURNS TABLE(user_id uuid, nome text, email text, role text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.nome, p.email, p.role::text
  FROM public.profiles p
  WHERE p.role != 'pending'
  ORDER BY p.nome
$$;
