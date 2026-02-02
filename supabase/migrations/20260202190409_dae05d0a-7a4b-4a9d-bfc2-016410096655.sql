-- Adicionar coluna contrato_url na tabela negotiations
ALTER TABLE public.negotiations
ADD COLUMN IF NOT EXISTS contrato_url TEXT DEFAULT NULL;

-- Adicionar coluna contrato_numero na tabela negotiations  
ALTER TABLE public.negotiations
ADD COLUMN IF NOT EXISTS contrato_numero TEXT DEFAULT NULL;

-- Criar bucket para contratos se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies para o bucket de contratos
-- Usuários aprovados podem fazer upload
CREATE POLICY "Approved users can upload contracts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contracts' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role != 'pending'
  )
);

-- Todos podem ver contratos (bucket público)
CREATE POLICY "Public can view contracts"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'contracts');

-- Gestores e masters podem deletar contratos
CREATE POLICY "Managers can delete contracts"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'contracts' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role IN ('gestor', 'master')
  )
);