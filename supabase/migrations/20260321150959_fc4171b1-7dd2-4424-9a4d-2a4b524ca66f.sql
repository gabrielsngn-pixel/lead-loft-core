
CREATE TABLE public.email_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_message_id text,
  event_type text NOT NULL,
  recipient_email text,
  event_timestamp timestamp with time zone,
  raw_payload jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.email_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gestors can view webhook events"
  ON public.email_webhook_events FOR SELECT
  TO authenticated
  USING (is_gestor(auth.uid()));

CREATE POLICY "Public insert for webhook"
  ON public.email_webhook_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
