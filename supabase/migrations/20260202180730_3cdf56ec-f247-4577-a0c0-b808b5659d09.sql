-- Create storage bucket for materials if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for materials bucket
CREATE POLICY "Approved users can upload materials"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'materials' 
  AND is_approved(auth.uid())
);

CREATE POLICY "Anyone can view materials"
ON storage.objects FOR SELECT
USING (bucket_id = 'materials');

CREATE POLICY "Approved users can update materials"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'materials'
  AND is_approved(auth.uid())
);

CREATE POLICY "Masters and gestors can delete materials"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'materials'
  AND (is_master(auth.uid()) OR is_gestor(auth.uid()))
);