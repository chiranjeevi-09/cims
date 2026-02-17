-- Add INSERT policy for notifications (only system/admin should create notifications)
-- For now, we'll allow authenticated users to insert notifications for themselves
CREATE POLICY "System can insert notifications for users"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);