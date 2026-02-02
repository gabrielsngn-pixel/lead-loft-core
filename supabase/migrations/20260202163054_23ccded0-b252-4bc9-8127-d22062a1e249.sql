-- Adicionar campos para indicadores do simulador na tabela negotiations
ALTER TABLE public.negotiations
  ADD COLUMN IF NOT EXISTS margem_estimada numeric,
  ADD COLUMN IF NOT EXISTS comissao_incorporador numeric,
  ADD COLUMN IF NOT EXISTS registro_valor numeric,
  ADD COLUMN IF NOT EXISTS registro_tipo text,
  ADD COLUMN IF NOT EXISTS receita_registro_loft_percent numeric,
  ADD COLUMN IF NOT EXISTS despesas_operacionais numeric,
  ADD COLUMN IF NOT EXISTS unidades integer,
  ADD COLUMN IF NOT EXISTS ticket_medio numeric,
  ADD COLUMN IF NOT EXISTS vgv_total numeric,
  ADD COLUMN IF NOT EXISTS comissao_bancaria_ponderada numeric,
  ADD COLUMN IF NOT EXISTS viabilidade_id uuid REFERENCES public.viabilidades(id) ON DELETE SET NULL;

-- Comentário sobre as novas etapas do kanban:
-- proposta_aprovada, proposta_enviada, em_negociacao, proposta_ganha, proposta_cancelada