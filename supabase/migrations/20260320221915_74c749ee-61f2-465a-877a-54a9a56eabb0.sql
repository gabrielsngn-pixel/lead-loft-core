
-- Add sender identity columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sender_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sender_email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reply_to_email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_signature_html text;

-- Create message_templates table
CREATE TABLE public.message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  channel text NOT NULL DEFAULT 'email',
  subject text,
  body text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mt_select" ON public.message_templates FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "mt_insert" ON public.message_templates FOR INSERT TO authenticated WITH CHECK (is_approved(auth.uid()) AND created_by = auth.uid());
CREATE POLICY "mt_update" ON public.message_templates FOR UPDATE TO authenticated USING (created_by = auth.uid() OR is_gestor(auth.uid()));
CREATE POLICY "mt_delete" ON public.message_templates FOR DELETE TO authenticated USING (created_by = auth.uid() OR is_gestor(auth.uid()));

-- Create bulk_dispatch_logs table (must be created before message_logs due to FK)
CREATE TABLE public.bulk_dispatch_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_nome text,
  channel text NOT NULL DEFAULT 'email',
  template_id uuid REFERENCES public.message_templates(id),
  total_leads integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bulk_dispatch_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bdl_select" ON public.bulk_dispatch_logs FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "bdl_insert" ON public.bulk_dispatch_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "bdl_update" ON public.bulk_dispatch_logs FOR UPDATE TO authenticated USING (user_id = auth.uid() OR is_gestor(auth.uid()));

-- Create message_logs table
CREATE TABLE public.message_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id),
  user_id uuid NOT NULL,
  channel text NOT NULL DEFAULT 'email',
  recipient text,
  subject text,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  provider_message_id text,
  template_id uuid REFERENCES public.message_templates(id),
  bulk_dispatch_id uuid REFERENCES public.bulk_dispatch_logs(id),
  sender_name text,
  sender_email text,
  reply_to text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  read_at timestamptz,
  replied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ml_select" ON public.message_logs FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "ml_insert" ON public.message_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "ml_update" ON public.message_logs FOR UPDATE TO authenticated USING (user_id = auth.uid() OR is_gestor(auth.uid()));
