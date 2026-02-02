-- Adicionar novos campos à tabela viabilidades para o simulador

-- Empresa (contato ativo) vinculada ao projeto
ALTER TABLE public.viabilidades
ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;

ALTER TABLE public.viabilidades
ADD COLUMN IF NOT EXISTS empresa_nome text;

-- Comissão do incorporador (salva da simulação)
ALTER TABLE public.viabilidades
ADD COLUMN IF NOT EXISTS comissao_incorporador numeric;

-- Data de habite-se
ALTER TABLE public.viabilidades
ADD COLUMN IF NOT EXISTS data_habitese timestamp with time zone;

-- Projeto atrasado (sim/não)
ALTER TABLE public.viabilidades
ADD COLUMN IF NOT EXISTS projeto_atrasado boolean DEFAULT false;

-- Dados completos da última simulação (JSON)
ALTER TABLE public.viabilidades
ADD COLUMN IF NOT EXISTS simulation_data jsonb;

-- Índice para busca por empresa
CREATE INDEX IF NOT EXISTS idx_viabilidades_empresa_id ON public.viabilidades(empresa_id);