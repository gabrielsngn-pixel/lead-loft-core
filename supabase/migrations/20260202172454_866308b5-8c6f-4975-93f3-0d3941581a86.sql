-- Create activities table
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  negociacao_id UUID REFERENCES public.negotiations(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('ligacao', 'email', 'reuniao', 'visita', 'tarefa')),
  categoria TEXT NOT NULL CHECK (categoria IN ('comercial', 'trade_marketing', 'tecnologia', 'cre')),
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_agendada TIMESTAMP WITH TIME ZONE NOT NULL,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  concluida BOOLEAN NOT NULL DEFAULT false,
  responsavel_id UUID,
  responsavel_nome TEXT,
  comentario TEXT,
  criado_por UUID NOT NULL,
  criado_por_nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies: All approved users can CRUD activities
CREATE POLICY "Approved users can view activities"
  ON public.activities FOR SELECT
  USING (public.is_approved(auth.uid()));

CREATE POLICY "Approved users can create activities"
  ON public.activities FOR INSERT
  WITH CHECK (public.is_approved(auth.uid()));

CREATE POLICY "Approved users can update activities"
  ON public.activities FOR UPDATE
  USING (public.is_approved(auth.uid()));

CREATE POLICY "Approved users can delete activities"
  ON public.activities FOR DELETE
  USING (public.is_approved(auth.uid()));

-- Add updated_at trigger
CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for common queries
CREATE INDEX idx_activities_data_agendada ON public.activities(data_agendada);
CREATE INDEX idx_activities_responsavel_id ON public.activities(responsavel_id);
CREATE INDEX idx_activities_categoria ON public.activities(categoria);