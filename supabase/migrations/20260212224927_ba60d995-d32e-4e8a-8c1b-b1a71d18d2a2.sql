
-- Table for storing weekly Head Comercial notes
CREATE TABLE public.executive_weekly_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  semana_ano TEXT NOT NULL, -- format: "WW/YYYY" e.g. "07/2026"
  nota_head TEXT,
  criado_por UUID NOT NULL,
  criado_por_nome TEXT NOT NULL,
  atualizado_por UUID,
  atualizado_por_nome TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(semana_ano)
);

-- Enable RLS
ALTER TABLE public.executive_weekly_notes ENABLE ROW LEVEL SECURITY;

-- Only master can view
CREATE POLICY "Master can view executive notes"
ON public.executive_weekly_notes
FOR SELECT
USING (is_master(auth.uid()));

-- Only master can insert
CREATE POLICY "Master can insert executive notes"
ON public.executive_weekly_notes
FOR INSERT
WITH CHECK (is_master(auth.uid()));

-- Only master can update
CREATE POLICY "Master can update executive notes"
ON public.executive_weekly_notes
FOR UPDATE
USING (is_master(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_executive_weekly_notes_updated_at
BEFORE UPDATE ON public.executive_weekly_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
