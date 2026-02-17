-- Add explicit deny policies for otp_verifications table
-- This makes it crystal clear that no client can access this table
-- Only the service_role key (used by edge functions) can access it

-- Deny SELECT for all roles
CREATE POLICY "Deny all reads"
ON public.otp_verifications
FOR SELECT
TO public
USING (false);

-- Deny INSERT for all roles  
CREATE POLICY "Deny all inserts"
ON public.otp_verifications
FOR INSERT
TO public
WITH CHECK (false);

-- Deny UPDATE for all roles
CREATE POLICY "Deny all updates"
ON public.otp_verifications
FOR UPDATE
TO public
USING (false);

-- Deny DELETE for all roles
CREATE POLICY "Deny all deletes"
ON public.otp_verifications
FOR DELETE
TO public
USING (false);