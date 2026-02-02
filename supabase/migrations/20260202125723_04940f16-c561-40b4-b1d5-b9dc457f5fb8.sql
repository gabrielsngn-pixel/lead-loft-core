-- Persistência do CRM: Leads (inclui Contatos Ativos) e Negociações

-- 1) LEADS (Repositório + Contatos Ativos)
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  cnpj text NOT NULL,
  razao_social text NOT NULL,
  nome_fantasia text,
  nome_contato text,

  email text NOT NULL,
  telefone text NOT NULL,
  cidade text NOT NULL,
  estado text NOT NULL,

  origem text NOT NULL DEFAULT 'outro',
  status text NOT NULL DEFAULT 'novo',
  prioridade text NOT NULL DEFAULT 'media',
  tipo_empresa text NOT NULL DEFAULT 'outro',

  responsavel_id uuid,
  responsavel_nome text,

  observacoes text,

  data_criacao timestamptz NOT NULL DEFAULT now(),
  data_ultima_interacao timestamptz NOT NULL DEFAULT now(),
  proxima_atividade timestamptz,
  proxima_reuniao timestamptz,

  criado_por uuid NOT NULL,
  criado_por_nome text NOT NULL,
  atualizado_por uuid,
  atualizado_por_nome text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_responsavel_id ON public.leads (responsavel_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads (status);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'leads' AND policyname = 'Approved users can view leads'
  ) THEN
    CREATE POLICY "Approved users can view leads"
    ON public.leads
    FOR SELECT
    TO authenticated
    USING (is_approved(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'leads' AND policyname = 'Approved users can insert leads'
  ) THEN
    CREATE POLICY "Approved users can insert leads"
    ON public.leads
    FOR INSERT
    TO authenticated
    WITH CHECK (is_approved(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'leads' AND policyname = 'Approved users can update leads'
  ) THEN
    CREATE POLICY "Approved users can update leads"
    ON public.leads
    FOR UPDATE
    TO authenticated
    USING (is_approved(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'leads' AND policyname = 'Approved users can delete leads'
  ) THEN
    CREATE POLICY "Approved users can delete leads"
    ON public.leads
    FOR DELETE
    TO authenticated
    USING (is_approved(auth.uid()));
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- 2) NEGOCIAÇÕES
CREATE TABLE IF NOT EXISTS public.negotiations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,

  titulo text NOT NULL,
  valor numeric NOT NULL DEFAULT 0,
  etapa text NOT NULL DEFAULT 'qualificacao',
  probabilidade integer NOT NULL DEFAULT 0,
  data_previsao_fechamento timestamptz,

  criado_por uuid NOT NULL,
  criado_por_nome text NOT NULL,
  atualizado_por uuid,
  atualizado_por_nome text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_negotiations_lead_id ON public.negotiations (lead_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_etapa ON public.negotiations (etapa);

ALTER TABLE public.negotiations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'negotiations' AND policyname = 'Approved users can view negotiations'
  ) THEN
    CREATE POLICY "Approved users can view negotiations"
    ON public.negotiations
    FOR SELECT
    TO authenticated
    USING (is_approved(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'negotiations' AND policyname = 'Approved users can insert negotiations'
  ) THEN
    CREATE POLICY "Approved users can insert negotiations"
    ON public.negotiations
    FOR INSERT
    TO authenticated
    WITH CHECK (is_approved(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'negotiations' AND policyname = 'Approved users can update negotiations'
  ) THEN
    CREATE POLICY "Approved users can update negotiations"
    ON public.negotiations
    FOR UPDATE
    TO authenticated
    USING (is_approved(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'negotiations' AND policyname = 'Approved users can delete negotiations'
  ) THEN
    CREATE POLICY "Approved users can delete negotiations"
    ON public.negotiations
    FOR DELETE
    TO authenticated
    USING (is_approved(auth.uid()));
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_negotiations_updated_at ON public.negotiations;
CREATE TRIGGER update_negotiations_updated_at
BEFORE UPDATE ON public.negotiations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
