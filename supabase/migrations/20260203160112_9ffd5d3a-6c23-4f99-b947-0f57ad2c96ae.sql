-- Adicionar coluna de status de andamento nas atividades
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS status_andamento TEXT NOT NULL DEFAULT 'em_andamento' 
CHECK (status_andamento IN ('concluida', 'atrasada', 'em_andamento', 'parada'));