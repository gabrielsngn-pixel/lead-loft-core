-- Add ultima_reuniao column to leads table
ALTER TABLE public.leads 
ADD COLUMN ultima_reuniao timestamp with time zone;