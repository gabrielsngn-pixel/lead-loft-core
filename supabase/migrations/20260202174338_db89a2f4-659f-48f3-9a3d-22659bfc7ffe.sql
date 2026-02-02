-- Create materials table
CREATE TABLE public.materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL CHECK (categoria IN ('treinamento', 'prospeccao', 'institucional')),
  tipo TEXT NOT NULL CHECK (tipo IN ('pdf', 'ppt', 'video', 'imagem', 'link', 'documento')),
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'arquivado')),
  publico_alvo TEXT NOT NULL DEFAULT 'todos' CHECK (publico_alvo IN ('sdr', 'consultor', 'gestor', 'todos')),
  
  -- File or link
  url TEXT,
  arquivo_nome TEXT,
  arquivo_tamanho BIGINT,
  
  -- Version control
  versao TEXT NOT NULL DEFAULT '1.0',
  
  -- Metadata
  recomendado BOOLEAN NOT NULL DEFAULT false,
  etapa_sugerida TEXT[],
  tags TEXT[] DEFAULT '{}',
  
  -- Tracking
  visualizacoes INTEGER NOT NULL DEFAULT 0,
  usos INTEGER NOT NULL DEFAULT 0,
  
  -- Audit fields
  criado_por UUID NOT NULL,
  criado_por_nome TEXT NOT NULL,
  atualizado_por UUID,
  atualizado_por_nome TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create material version history table
CREATE TABLE public.material_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  versao TEXT NOT NULL,
  autor TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create material usage tracking table
CREATE TABLE public.material_usages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  lead_name TEXT,
  negociacao_id UUID REFERENCES public.negotiations(id) ON DELETE SET NULL,
  contexto TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_usages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for materials
CREATE POLICY "Approved users can view materials"
ON public.materials
FOR SELECT
USING (is_approved(auth.uid()));

CREATE POLICY "Approved users can insert materials"
ON public.materials
FOR INSERT
WITH CHECK (is_approved(auth.uid()));

CREATE POLICY "Approved users can update materials"
ON public.materials
FOR UPDATE
USING (is_approved(auth.uid()));

CREATE POLICY "Masters and gestors can delete materials"
ON public.materials
FOR DELETE
USING (is_master(auth.uid()) OR is_gestor(auth.uid()));

-- RLS Policies for material versions
CREATE POLICY "Approved users can view material versions"
ON public.material_versions
FOR SELECT
USING (is_approved(auth.uid()));

CREATE POLICY "Approved users can insert material versions"
ON public.material_versions
FOR INSERT
WITH CHECK (is_approved(auth.uid()));

-- RLS Policies for material usages
CREATE POLICY "Approved users can view material usages"
ON public.material_usages
FOR SELECT
USING (is_approved(auth.uid()));

CREATE POLICY "Approved users can insert material usages"
ON public.material_usages
FOR INSERT
WITH CHECK (is_approved(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_materials_categoria ON public.materials(categoria);
CREATE INDEX idx_materials_status ON public.materials(status);
CREATE INDEX idx_materials_tipo ON public.materials(tipo);
CREATE INDEX idx_material_versions_material_id ON public.material_versions(material_id);
CREATE INDEX idx_material_usages_material_id ON public.material_usages(material_id);
CREATE INDEX idx_material_usages_user_id ON public.material_usages(user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_materials_updated_at
BEFORE UPDATE ON public.materials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();