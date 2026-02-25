
-- Create table for contact follow-up actions
CREATE TABLE public.contact_followups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'ligacao', 'whatsapp', 'sms', 'linkedin', 'email'
  anotacoes TEXT,
  data_acao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  criado_por UUID NOT NULL,
  criado_por_nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_followups ENABLE ROW LEVEL SECURITY;

-- Policies: all approved users can CRUD
CREATE POLICY "Approved users can view followups"
  ON public.contact_followups FOR SELECT
  USING (is_approved(auth.uid()));

CREATE POLICY "Approved users can insert followups"
  ON public.contact_followups FOR INSERT
  WITH CHECK (is_approved(auth.uid()));

CREATE POLICY "Approved users can update followups"
  ON public.contact_followups FOR UPDATE
  USING (is_approved(auth.uid()));

CREATE POLICY "Approved users can delete followups"
  ON public.contact_followups FOR DELETE
  USING (is_approved(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_contact_followups_updated_at
  BEFORE UPDATE ON public.contact_followups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
