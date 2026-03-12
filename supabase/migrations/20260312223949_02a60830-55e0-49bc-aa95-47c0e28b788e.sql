
CREATE TABLE public.minutas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  negotiation_id uuid REFERENCES public.negotiations(id) ON DELETE CASCADE,
  viabilidade_id uuid REFERENCES public.viabilidades(id) ON DELETE SET NULL,
  nome_empreendimento text NOT NULL,
  empresa_nome text NOT NULL,
  cnpj text,
  endereco text,
  cidade text,
  estado text,
  representante_legal text,
  cpf_representante text,
  nome_fantasia text,
  dados_projeto jsonb,
  clausulas jsonb NOT NULL DEFAULT '[]'::jsonb,
  numero_contrato text NOT NULL,
  data_assinatura timestamp with time zone DEFAULT now(),
  criado_por uuid NOT NULL,
  criado_por_nome text NOT NULL,
  atualizado_por uuid,
  atualizado_por_nome text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.minutas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view minutas" ON public.minutas FOR SELECT TO authenticated USING (public.is_approved(auth.uid()));
CREATE POLICY "Approved users can insert minutas" ON public.minutas FOR INSERT TO authenticated WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "Approved users can update minutas" ON public.minutas FOR UPDATE TO authenticated USING (public.is_approved(auth.uid()));
CREATE POLICY "Masters can delete minutas" ON public.minutas FOR DELETE TO authenticated USING (public.is_master(auth.uid()));
