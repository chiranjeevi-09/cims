-- Remove the redundant service_role policy
-- Service role bypasses RLS by design, so this policy is unnecessary
-- Having no policies with RLS enabled means only service_role can access the table
DROP POLICY IF EXISTS "Service role only access" ON public.otp_verifications;

-- Verify RLS is still enabled (this is a no-op if already enabled)
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner as well (extra security)
ALTER TABLE public.otp_verifications FORCE ROW LEVEL SECURITY;