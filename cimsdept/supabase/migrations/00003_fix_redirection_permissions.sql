-- FIX: Allow officials to redirect complaints (bypass RLS restriction on department change)
-- Run this in your Supabase SQL Editor

-- 1. Create a more robust version of update_complaint_status that handles redirection
create or replace function redirect_complaint_rpc(
  complaint_id_param uuid,
  new_department department_type,
  redirected_by_param uuid,
  from_dept_param department_type,
  reason_param text default null
)
returns void
language plpgsql
security definer -- This bypasses RLS
as $$
begin
  -- Update complaint
  update complaints
  set 
    status = 'new'::complaint_status,
    assigned_department = new_department,
    assigned_to = null, -- Reset assignment
    updated_at = now()
  where id = complaint_id_param;

  -- Insert redirect record
  insert into complaint_redirects (
    complaint_id,
    from_department,
    to_department,
    redirected_by,
    reason
  ) values (
    complaint_id_param,
    from_dept_param,
    new_department,
    redirected_by_param,
    reason_param
  );
end;
$$;
