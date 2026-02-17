-- Fix handle_new_user function with input validation and length limits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Validate email format
  IF NEW.email IS NULL OR NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Insert profile with sanitized/limited metadata inputs
  INSERT INTO public.profiles (user_id, name, email, city, phone)
  VALUES (
    NEW.id, 
    COALESCE(substring(NEW.raw_user_meta_data ->> 'name', 1, 100), 'User'),
    NEW.email,
    substring(NEW.raw_user_meta_data ->> 'city', 1, 100),
    substring(NEW.raw_user_meta_data ->> 'phone', 1, 20)
  );
  RETURN NEW;
END;
$$;

-- Create OTP verifications table for persistent storage
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  otp TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  attempts INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE
);

-- Add unique constraint on phone (only one active OTP per phone)
CREATE UNIQUE INDEX IF NOT EXISTS idx_otp_phone ON public.otp_verifications(phone);

-- Add index on expiry for cleanup
CREATE INDEX IF NOT EXISTS idx_otp_expiry ON public.otp_verifications(expires_at);

-- Enable RLS
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Only service role can access (Edge Functions use service role key)
-- Default deny for all other roles
CREATE POLICY "Service role only access"
ON public.otp_verifications
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);