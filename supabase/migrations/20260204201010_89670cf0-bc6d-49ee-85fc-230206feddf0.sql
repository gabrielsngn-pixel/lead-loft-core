-- Create enum for prospect status
CREATE TYPE public.prospect_status AS ENUM (
  'novo',
  'em_contato',
  'reuniao_agendada',
  'reuniao_realizada',
  'qualificado',
  'descartado',
  'convertido'
);

-- Create prospects table
CREATE TABLE public.prospects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  cargo TEXT NOT NULL,
  empresa TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefone TEXT,
  linkedin_url TEXT NOT NULL UNIQUE,
  origem TEXT NOT NULL DEFAULT 'Apollo',
  status prospect_status NOT NULL DEFAULT 'novo',
  data_importacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  consultor_responsavel_id UUID,
  consultor_responsavel_nome TEXT,
  convertido_em TIMESTAMP WITH TIME ZONE,
  contato_ativo_id UUID,
  observacoes TEXT,
  criado_por UUID NOT NULL,
  criado_por_nome TEXT NOT NULL,
  atualizado_por UUID,
  atualizado_por_nome TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prospect_activities table for activities linked to prospects
CREATE TABLE public.prospect_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prospect_id UUID NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'ligacao', 'email', 'whatsapp', 'reuniao', 'upload_ata'
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_atividade TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  arquivo_url TEXT,
  arquivo_nome TEXT,
  responsavel_id UUID NOT NULL,
  responsavel_nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prospect_import_logs table to track imports and enforce limits
CREATE TABLE public.prospect_import_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_nome TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  registros_importados INTEGER NOT NULL DEFAULT 0,
  registros_ignorados INTEGER NOT NULL DEFAULT 0,
  motivos_ignorados JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_import_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prospects
-- All approved users can view
CREATE POLICY "Approved users can view prospects"
ON public.prospects
FOR SELECT
USING (is_approved(auth.uid()));

-- All approved users can update (for status changes, activities)
CREATE POLICY "Approved users can update prospects"
ON public.prospects
FOR UPDATE
USING (is_approved(auth.uid()));

-- Only Master can insert (import)
CREATE POLICY "Only Master can insert prospects"
ON public.prospects
FOR INSERT
WITH CHECK (is_master(auth.uid()));

-- Only Master can delete
CREATE POLICY "Only Master can delete prospects"
ON public.prospects
FOR DELETE
USING (is_master(auth.uid()));

-- RLS Policies for prospect_activities
CREATE POLICY "Approved users can view prospect activities"
ON public.prospect_activities
FOR SELECT
USING (is_approved(auth.uid()));

CREATE POLICY "Approved users can insert prospect activities"
ON public.prospect_activities
FOR INSERT
WITH CHECK (is_approved(auth.uid()));

-- RLS Policies for prospect_import_logs
CREATE POLICY "Masters can view import logs"
ON public.prospect_import_logs
FOR SELECT
USING (is_master(auth.uid()));

CREATE POLICY "Masters can insert import logs"
ON public.prospect_import_logs
FOR INSERT
WITH CHECK (is_master(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_prospects_updated_at
BEFORE UPDATE ON public.prospects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();