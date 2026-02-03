-- Add linkedin column to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS linkedin text;

-- Add comment for documentation
COMMENT ON COLUMN public.leads.linkedin IS 'LinkedIn profile URL of the contact';