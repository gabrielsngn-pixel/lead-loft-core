
-- Add contract status column to viabilidades
ALTER TABLE public.viabilidades 
ADD COLUMN IF NOT EXISTS status_contrato text DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.viabilidades.status_contrato IS 'Status do contrato: assinado ou em_assinatura';
