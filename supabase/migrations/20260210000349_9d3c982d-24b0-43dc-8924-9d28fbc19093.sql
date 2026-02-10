
-- Empreendimentos main table
CREATE TABLE public.empreendimentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_empreendimento TEXT NOT NULL,
  construtora TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  data_habitese TIMESTAMP WITH TIME ZONE,
  mes_ano_habitese TEXT,
  ano_habitese INTEGER,
  tipo_empreendimento TEXT NOT NULL DEFAULT 'residencial',
  status TEXT NOT NULL DEFAULT 'mapeado',
  gestor_responsavel_id UUID,
  gestor_responsavel_nome TEXT,
  consultor_responsavel_id UUID,
  consultor_responsavel_nome TEXT,
  observacoes TEXT,
  unidades_estimadas INTEGER,
  ticket_medio NUMERIC,
  vgv_estimado NUMERIC,
  banco_financiador TEXT,
  modelo_repasse TEXT,
  chave_unica TEXT NOT NULL,
  fonte_importacao TEXT NOT NULL DEFAULT 'manual',
  data_importacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  importado_por UUID,
  importado_por_nome TEXT,
  status_importacao TEXT NOT NULL DEFAULT 'novo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT empreendimentos_chave_unica_unique UNIQUE (chave_unica)
);

ALTER TABLE public.empreendimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view empreendimentos"
  ON public.empreendimentos FOR SELECT
  USING (is_approved(auth.uid()));

CREATE POLICY "Gestors can insert empreendimentos"
  ON public.empreendimentos FOR INSERT
  WITH CHECK (is_gestor(auth.uid()));

CREATE POLICY "Gestors can update empreendimentos"
  ON public.empreendimentos FOR UPDATE
  USING (is_gestor(auth.uid()));

CREATE POLICY "Masters can delete empreendimentos"
  ON public.empreendimentos FOR DELETE
  USING (is_master(auth.uid()));

CREATE TRIGGER update_empreendimentos_updated_at
  BEFORE UPDATE ON public.empreendimentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-calculate mes_ano_habitese and ano_habitese
CREATE OR REPLACE FUNCTION public.calc_habitese_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.data_habitese IS NOT NULL THEN
    NEW.mes_ano_habitese := to_char(NEW.data_habitese, 'MM/YYYY');
    NEW.ano_habitese := EXTRACT(YEAR FROM NEW.data_habitese)::INTEGER;
  ELSE
    NEW.mes_ano_habitese := NULL;
    NEW.ano_habitese := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER calc_empreendimentos_habitese
  BEFORE INSERT OR UPDATE ON public.empreendimentos
  FOR EACH ROW EXECUTE FUNCTION public.calc_habitese_fields();

-- Import logs table
CREATE TABLE public.empreendimento_import_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data_importacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fonte TEXT NOT NULL,
  total_registros INTEGER NOT NULL DEFAULT 0,
  quantidade_importada INTEGER NOT NULL DEFAULT 0,
  quantidade_ignorada INTEGER NOT NULL DEFAULT 0,
  user_id UUID NOT NULL,
  user_nome TEXT NOT NULL,
  log_erros JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.empreendimento_import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gestors can view empreendimento import logs"
  ON public.empreendimento_import_logs FOR SELECT
  USING (is_gestor(auth.uid()));

CREATE POLICY "Gestors can insert empreendimento import logs"
  ON public.empreendimento_import_logs FOR INSERT
  WITH CHECK (is_gestor(auth.uid()));

-- Decisores link table
CREATE TABLE public.empreendimento_decisores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empreendimento_id UUID NOT NULL REFERENCES public.empreendimentos(id) ON DELETE CASCADE,
  prospect_id UUID REFERENCES public.prospects(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  cargo TEXT,
  empresa TEXT,
  tipo_vinculo TEXT NOT NULL DEFAULT 'prospect',
  origem TEXT,
  email TEXT,
  telefone TEXT,
  linkedin TEXT,
  consultor_responsavel_id UUID,
  consultor_responsavel_nome TEXT,
  status_relacionamento TEXT NOT NULL DEFAULT 'nao_contatado',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.empreendimento_decisores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view decisores"
  ON public.empreendimento_decisores FOR SELECT
  USING (is_approved(auth.uid()));

CREATE POLICY "Gestors can insert decisores"
  ON public.empreendimento_decisores FOR INSERT
  WITH CHECK (is_gestor(auth.uid()));

CREATE POLICY "Gestors can update decisores"
  ON public.empreendimento_decisores FOR UPDATE
  USING (is_gestor(auth.uid()));

CREATE POLICY "Gestors can delete decisores"
  ON public.empreendimento_decisores FOR DELETE
  USING (is_gestor(auth.uid()));

CREATE TRIGGER update_empreendimento_decisores_updated_at
  BEFORE UPDATE ON public.empreendimento_decisores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
