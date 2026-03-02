
-- Repository of deleted active contacts
CREATE TABLE public.deleted_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  razao_social text NOT NULL,
  nome_fantasia text,
  nome_contato text,
  email text,
  telefone text,
  cnpj text,
  cidade text,
  estado text,
  tipo_empresa text,
  responsavel_id uuid,
  responsavel_nome text,
  justificativa text NOT NULL,
  excluido_por uuid NOT NULL,
  excluido_por_nome text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.deleted_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view deleted contacts"
ON public.deleted_contacts FOR SELECT
USING (is_approved(auth.uid()));

CREATE POLICY "Approved users can insert deleted contacts"
ON public.deleted_contacts FOR INSERT
WITH CHECK (is_approved(auth.uid()));

CREATE POLICY "Masters can delete deleted contacts"
ON public.deleted_contacts FOR DELETE
USING (is_master(auth.uid()));
