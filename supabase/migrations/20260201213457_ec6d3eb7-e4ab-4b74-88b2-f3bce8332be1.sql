-- PASSO 2: Criar tabelas e funções

-- Criar tabela repositório central de documentos
CREATE TABLE public.repository_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('viabilidade', 'contrato', 'ata', 'proposta', 'documento')),
  titulo TEXT NOT NULL,
  descricao TEXT,
  
  -- Vinculação com entidades
  lead_id UUID,
  contato_id UUID,
  negocio_id UUID,
  
  -- Arquivo
  arquivo_url TEXT,
  arquivo_nome TEXT,
  arquivo_tamanho BIGINT,
  
  -- Versionamento
  versao TEXT NOT NULL DEFAULT '1.0',
  versao_anterior_id UUID REFERENCES public.repository_documents(id),
  
  -- Metadados
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'arquivado', 'rascunho')),
  tags TEXT[],
  
  -- Auditoria
  criado_por UUID NOT NULL,
  criado_por_nome TEXT NOT NULL,
  atualizado_por UUID,
  atualizado_por_nome TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de viabilidades (integração Viability Compass)
CREATE TABLE public.viabilidades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Vinculação
  lead_id UUID,
  contato_id UUID,
  negocio_id UUID,
  
  -- Dados do empreendimento
  nome_empreendimento TEXT NOT NULL,
  cnpj TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  
  -- Campos do Viability Compass (referência ao projeto 35)
  viability_compass_id TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_analise', 'aprovado', 'reprovado', 'revisao')),
  resultado TEXT CHECK (resultado IN ('viavel', 'inviavel', 'condicional')),
  
  -- Métricas financeiras (retornadas do Viability Compass)
  margem_estimada DECIMAL(10,2),
  vgv_estimado DECIMAL(15,2),
  custo_terreno DECIMAL(15,2),
  custo_obra DECIMAL(15,2),
  tir_estimada DECIMAL(5,2),
  payback_meses INTEGER,
  
  -- Recomendação
  recomendacao TEXT CHECK (recomendacao IN ('simples', 'media', 'nao')),
  observacoes TEXT,
  
  -- Anexos/Documentos
  documento_id UUID REFERENCES public.repository_documents(id),
  
  -- Auditoria
  solicitado_por UUID NOT NULL,
  solicitado_por_nome TEXT NOT NULL,
  analisado_por UUID,
  analisado_por_nome TEXT,
  data_solicitacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_analise TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.repository_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viabilidades ENABLE ROW LEVEL SECURITY;

-- Função para verificar se é master
CREATE OR REPLACE FUNCTION public.is_master(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = check_user_id AND role = 'master'
  )
$$;

-- RLS Policies para repository_documents
CREATE POLICY "Usuarios aprovados podem ver documentos"
ON public.repository_documents
FOR SELECT
USING (is_approved(auth.uid()));

CREATE POLICY "Usuarios aprovados podem inserir documentos"
ON public.repository_documents
FOR INSERT
WITH CHECK (is_approved(auth.uid()));

CREATE POLICY "Usuarios podem atualizar documentos"
ON public.repository_documents
FOR UPDATE
USING (is_master(auth.uid()) OR is_gestor(auth.uid()) OR criado_por = auth.uid());

CREATE POLICY "Masters podem deletar documentos"
ON public.repository_documents
FOR DELETE
USING (is_master(auth.uid()));

-- RLS Policies para viabilidades
CREATE POLICY "Usuarios aprovados podem ver viabilidades"
ON public.viabilidades
FOR SELECT
USING (is_approved(auth.uid()));

CREATE POLICY "Usuarios aprovados podem inserir viabilidades"
ON public.viabilidades
FOR INSERT
WITH CHECK (is_approved(auth.uid()));

CREATE POLICY "Usuarios podem atualizar viabilidades"
ON public.viabilidades
FOR UPDATE
USING (is_master(auth.uid()) OR is_gestor(auth.uid()) OR solicitado_por = auth.uid());

CREATE POLICY "Masters podem deletar viabilidades"
ON public.viabilidades
FOR DELETE
USING (is_master(auth.uid()));

-- Triggers para updated_at
CREATE TRIGGER update_repository_documents_updated_at
BEFORE UPDATE ON public.repository_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_viabilidades_updated_at
BEFORE UPDATE ON public.viabilidades
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar bucket de storage para documentos do repositório
INSERT INTO storage.buckets (id, name, public) 
VALUES ('repository-documents', 'repository-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
CREATE POLICY "Usuarios aprovados podem ver documentos repo"
ON storage.objects
FOR SELECT
USING (bucket_id = 'repository-documents' AND is_approved(auth.uid()));

CREATE POLICY "Usuarios aprovados podem upload documentos repo"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'repository-documents' AND is_approved(auth.uid()));

CREATE POLICY "Masters podem deletar documentos repo"
ON storage.objects
FOR DELETE
USING (bucket_id = 'repository-documents' AND is_master(auth.uid()));