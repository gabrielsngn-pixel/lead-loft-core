-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('pending', 'sdr', 'consultor', 'gestor');

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  nome TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'pending',
  avatar_url TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create access requests table for tracking approval workflow
CREATE TABLE public.access_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  nome TEXT NOT NULL,
  requested_role user_role NOT NULL DEFAULT 'consultor',
  justificativa TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin action logs table for audit trail
CREATE TABLE public.admin_action_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID REFERENCES auth.users(id) NOT NULL,
  admin_name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id),
  target_user_email TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(check_user_id UUID)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = check_user_id
$$;

-- Create function to check if user is gestor
CREATE OR REPLACE FUNCTION public.is_gestor(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = check_user_id AND role = 'gestor'
  )
$$;

-- Create function to check if user is approved (not pending)
CREATE OR REPLACE FUNCTION public.is_approved(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = check_user_id AND role != 'pending'
  )
$$;

-- RLS Policies for profiles
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Gestors can view all profiles
CREATE POLICY "Gestors can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_gestor(auth.uid()));

-- Users can insert their own profile on signup
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Gestors can update any profile
CREATE POLICY "Gestors can update profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_gestor(auth.uid()));

-- RLS Policies for access_requests
-- Users can view their own requests
CREATE POLICY "Users can view own requests"
  ON public.access_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Gestors can view all requests
CREATE POLICY "Gestors can view all requests"
  ON public.access_requests FOR SELECT
  USING (public.is_gestor(auth.uid()));

-- Users can insert their own requests
CREATE POLICY "Users can insert own requests"
  ON public.access_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Gestors can update any request
CREATE POLICY "Gestors can update requests"
  ON public.access_requests FOR UPDATE
  USING (public.is_gestor(auth.uid()));

-- RLS Policies for admin_action_logs
-- Gestors can view all logs
CREATE POLICY "Gestors can view all logs"
  ON public.admin_action_logs FOR SELECT
  USING (public.is_gestor(auth.uid()));

-- Gestors can insert logs
CREATE POLICY "Gestors can insert logs"
  ON public.admin_action_logs FOR INSERT
  WITH CHECK (public.is_gestor(auth.uid()));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup - creates profile automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, nome, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    'pending'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();