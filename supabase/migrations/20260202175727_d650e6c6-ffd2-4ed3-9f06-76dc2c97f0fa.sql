-- Create meetings table for storing atas
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  negociacao_id UUID REFERENCES public.negotiations(id) ON DELETE SET NULL,
  empresa TEXT NOT NULL,
  cnpj TEXT NOT NULL,
  tipo_reuniao TEXT NOT NULL DEFAULT 'apresentacao',
  data_reuniao TIMESTAMP WITH TIME ZONE NOT NULL,
  hora_inicio TEXT,
  hora_fim TEXT,
  consultor_id UUID,
  consultor_nome TEXT NOT NULL,
  participantes TEXT[] DEFAULT '{}',
  objetivos TEXT,
  pauta TEXT,
  discussao TEXT,
  decisoes TEXT,
  proximos_passos TEXT,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'agendada',
  arquivada BOOLEAN NOT NULL DEFAULT false,
  vinculada_contato BOOLEAN NOT NULL DEFAULT false,
  criado_por UUID NOT NULL,
  criado_por_nome TEXT NOT NULL,
  atualizado_por UUID,
  atualizado_por_nome TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meeting history table
CREATE TABLE public.meeting_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  campo TEXT NOT NULL,
  valor_anterior TEXT,
  valor_novo TEXT,
  usuario_id UUID NOT NULL,
  usuario_nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for meetings
CREATE POLICY "Approved users can view meetings"
  ON public.meetings FOR SELECT
  USING (is_approved(auth.uid()));

CREATE POLICY "Approved users can insert meetings"
  ON public.meetings FOR INSERT
  WITH CHECK (is_approved(auth.uid()));

CREATE POLICY "Approved users can update meetings"
  ON public.meetings FOR UPDATE
  USING (is_approved(auth.uid()));

CREATE POLICY "Masters and gestors can delete meetings"
  ON public.meetings FOR DELETE
  USING (is_master(auth.uid()) OR is_gestor(auth.uid()));

-- RLS policies for meeting_history
CREATE POLICY "Approved users can view meeting history"
  ON public.meeting_history FOR SELECT
  USING (is_approved(auth.uid()));

CREATE POLICY "Approved users can insert meeting history"
  ON public.meeting_history FOR INSERT
  WITH CHECK (is_approved(auth.uid()));

-- Create indexes
CREATE INDEX idx_meetings_lead_id ON public.meetings(lead_id);
CREATE INDEX idx_meetings_status ON public.meetings(status);
CREATE INDEX idx_meetings_data_reuniao ON public.meetings(data_reuniao);
CREATE INDEX idx_meetings_arquivada ON public.meetings(arquivada);
CREATE INDEX idx_meeting_history_meeting_id ON public.meeting_history(meeting_id);

-- Create trigger for updated_at
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();