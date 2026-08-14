-- Ayalon Kedem Time — RLS + פונקציות עסקיות (RPC)

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function is_month_locked(p_date date) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select locked from monthly_locks where year = extract(year from p_date) and month = extract(month from p_date)),
    false
  );
$$;

create or replace function log_audit(p_action text, p_entity_type text, p_entity_id uuid, p_old jsonb, p_new jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into audit_logs (actor_id, action, entity_type, entity_id, old_value, new_value)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, p_old, p_new);
end;
$$;

-- ===================== RLS =====================

alter table profiles enable row level security;
alter table attendance enable row level security;
alter table breaks enable row level security;
alter table attendance_corrections enable row level security;
alter table absences enable row level security;
alter table monthly_locks enable row level security;
alter table audit_logs enable row level security;
alter table settings enable row level security;

-- profiles
create policy profiles_select_own on profiles for select
  using (id = auth.uid() or is_admin());
create policy profiles_admin_insert on profiles for insert
  with check (is_admin());
create policy profiles_admin_update on profiles for update
  using (is_admin());
create policy profiles_admin_delete on profiles for delete
  using (is_admin());

-- attendance: קריאה בלבד ישירות מהטבלה; כתיבה רק דרך RPC (SECURITY DEFINER) או ע"י admin
create policy attendance_select on attendance for select
  using (employee_id = auth.uid() or is_admin());
create policy attendance_admin_write on attendance for insert
  with check (is_admin());
create policy attendance_admin_update on attendance for update
  using (is_admin());
create policy attendance_admin_delete on attendance for delete
  using (is_admin());

-- breaks
create policy breaks_select on breaks for select
  using (
    exists(select 1 from attendance a where a.id = attendance_id and (a.employee_id = auth.uid() or is_admin()))
  );
create policy breaks_admin_write on breaks for insert with check (is_admin());
create policy breaks_admin_update on breaks for update using (is_admin());

-- attendance_corrections
create policy corrections_select on attendance_corrections for select
  using (employee_id = auth.uid() or is_admin());
create policy corrections_employee_insert on attendance_corrections for insert
  with check (employee_id = auth.uid() and not is_month_locked(work_date));
create policy corrections_admin_update on attendance_corrections for update
  using (is_admin());

-- absences
create policy absences_select on absences for select
  using (employee_id = auth.uid() or is_admin());
create policy absences_employee_insert on absences for insert
  with check (employee_id = auth.uid());
create policy absences_admin_update on absences for update
  using (is_admin());
create policy absences_employee_update_own_pending on absences for update
  using (employee_id = auth.uid() and status = 'pending');

-- monthly_locks
create policy monthly_locks_select on monthly_locks for select
  using (auth.uid() is not null);
create policy monthly_locks_admin_write on monthly_locks for insert with check (is_admin());
create policy monthly_locks_admin_update on monthly_locks for update using (is_admin());

-- audit_logs
create policy audit_logs_admin_select on audit_logs for select
  using (is_admin());

-- settings
create policy settings_select on settings for select
  using (auth.uid() is not null);
create policy settings_admin_update on settings for update using (is_admin());
create policy settings_admin_insert on settings for insert with check (is_admin());

-- ===================== RPC: החתמת נוכחות =====================

create or replace function clock_in(p_notes text default null) returns attendance
language plpgsql security definer set search_path = public as $$
declare
  v_row attendance;
  v_profile profiles;
begin
  select * into v_profile from profiles where id = auth.uid();
  if v_profile is null or not v_profile.active then
    raise exception 'המשתמש אינו פעיל';
  end if;

  if exists(select 1 from attendance where employee_id = auth.uid() and clock_out is null) then
    raise exception 'קיימת כניסה פתוחה - יש לבצע יציאה קודם';
  end if;

  if is_month_locked(current_date) then
    raise exception 'החודש נעול לעריכה';
  end if;

  insert into attendance (employee_id, work_date, clock_in, source, notes)
  values (auth.uid(), current_date, now(), 'self', p_notes)
  returning * into v_row;

  perform log_audit('clock_in', 'attendance', v_row.id, null, to_jsonb(v_row));
  return v_row;
end;
$$;

create or replace function clock_out() returns attendance
language plpgsql security definer set search_path = public as $$
declare
  v_row attendance;
  v_old jsonb;
begin
  select * into v_row from attendance where employee_id = auth.uid() and clock_out is null
    order by clock_in desc limit 1;

  if v_row is null then
    raise exception 'לא נמצאה כניסה פתוחה';
  end if;

  if exists(select 1 from breaks where attendance_id = v_row.id and break_end is null) then
    raise exception 'יש לסיים הפסקה פתוחה לפני היציאה';
  end if;

  v_old := to_jsonb(v_row);

  update attendance set clock_out = now() where id = v_row.id
  returning * into v_row;

  perform log_audit('clock_out', 'attendance', v_row.id, v_old, to_jsonb(v_row));
  return v_row;
end;
$$;

create or replace function start_break() returns breaks
language plpgsql security definer set search_path = public as $$
declare
  v_attendance attendance;
  v_break breaks;
begin
  select * into v_attendance from attendance where employee_id = auth.uid() and clock_out is null
    order by clock_in desc limit 1;

  if v_attendance is null then
    raise exception 'אין כניסה פתוחה כרגע';
  end if;

  if exists(select 1 from breaks where attendance_id = v_attendance.id and break_end is null) then
    raise exception 'כבר קיימת הפסקה פתוחה';
  end if;

  insert into breaks (attendance_id, break_start) values (v_attendance.id, now())
  returning * into v_break;

  perform log_audit('start_break', 'breaks', v_break.id, null, to_jsonb(v_break));
  return v_break;
end;
$$;

create or replace function end_break() returns breaks
language plpgsql security definer set search_path = public as $$
declare
  v_break breaks;
  v_old jsonb;
begin
  select b.* into v_break from breaks b
    join attendance a on a.id = b.attendance_id
    where a.employee_id = auth.uid() and b.break_end is null
    order by b.break_start desc limit 1;

  if v_break is null then
    raise exception 'אין הפסקה פתוחה כרגע';
  end if;

  v_old := to_jsonb(v_break);

  update breaks set break_end = now() where id = v_break.id
  returning * into v_break;

  perform log_audit('end_break', 'breaks', v_break.id, v_old, to_jsonb(v_break));
  return v_break;
end;
$$;

-- ===================== RPC: בקשות תיקון שעות =====================

create or replace function request_correction(
  p_work_date date, p_clock_in time, p_clock_out time, p_reason text
) returns attendance_corrections
language plpgsql security definer set search_path = public as $$
declare
  v_row attendance_corrections;
  v_existing attendance;
begin
  if is_month_locked(p_work_date) then
    raise exception 'החודש נעול - לא ניתן להגיש בקשת תיקון';
  end if;

  select * into v_existing from attendance
    where employee_id = auth.uid() and work_date = p_work_date
    order by clock_in desc limit 1;

  insert into attendance_corrections (
    employee_id, work_date, requested_clock_in, requested_clock_out, reason,
    original_clock_in, original_clock_out
  ) values (
    auth.uid(), p_work_date, p_clock_in, p_clock_out, p_reason,
    v_existing.clock_in, v_existing.clock_out
  ) returning * into v_row;

  perform log_audit('request_correction', 'attendance_corrections', v_row.id, null, to_jsonb(v_row));
  return v_row;
end;
$$;

create or replace function review_correction(p_id uuid, p_approve boolean, p_note text default null) returns attendance_corrections
language plpgsql security definer set search_path = public as $$
declare
  v_req attendance_corrections;
  v_attendance attendance;
  v_old_attendance jsonb;
begin
  if not is_admin() then
    raise exception 'רק מנהל יכול לאשר בקשות';
  end if;

  select * into v_req from attendance_corrections where id = p_id;
  if v_req is null then
    raise exception 'בקשה לא נמצאה';
  end if;
  if v_req.status <> 'pending' then
    raise exception 'הבקשה כבר טופלה';
  end if;

  update attendance_corrections set
    status = case when p_approve then 'approved' else 'rejected' end,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    review_note = p_note
  where id = p_id
  returning * into v_req;

  if p_approve then
    select * into v_attendance from attendance
      where employee_id = v_req.employee_id and work_date = v_req.work_date
      order by clock_in desc limit 1;

    v_old_attendance := to_jsonb(v_attendance);

    if v_attendance is null then
      insert into attendance (employee_id, work_date, clock_in, clock_out, source)
      values (
        v_req.employee_id, v_req.work_date,
        (v_req.work_date + coalesce(v_req.requested_clock_in, '00:00'))::timestamptz,
        case when v_req.requested_clock_out is not null then (v_req.work_date + v_req.requested_clock_out)::timestamptz else null end,
        'correction'
      ) returning * into v_attendance;
    else
      update attendance set
        clock_in = case when v_req.requested_clock_in is not null then (v_req.work_date + v_req.requested_clock_in)::timestamptz else clock_in end,
        clock_out = case when v_req.requested_clock_out is not null then (v_req.work_date + v_req.requested_clock_out)::timestamptz else clock_out end,
        source = 'correction'
      where id = v_attendance.id
      returning * into v_attendance;
    end if;

    perform log_audit('approve_correction', 'attendance', v_attendance.id, v_old_attendance, to_jsonb(v_attendance));
  else
    perform log_audit('reject_correction', 'attendance_corrections', v_req.id, null, to_jsonb(v_req));
  end if;

  return v_req;
end;
$$;

-- ===================== RPC: חופשות/מחלות =====================

create or replace function request_leave(
  p_type absence_type, p_start date, p_end date, p_reason text, p_attachment_path text default null
) returns absences
language plpgsql security definer set search_path = public as $$
declare
  v_row absences;
begin
  if p_end < p_start then
    raise exception 'תאריך סיום לפני תאריך התחלה';
  end if;

  insert into absences (employee_id, type, start_date, end_date, reason, attachment_path)
  values (auth.uid(), p_type, p_start, p_end, p_reason, p_attachment_path)
  returning * into v_row;

  perform log_audit('request_leave', 'absences', v_row.id, null, to_jsonb(v_row));
  return v_row;
end;
$$;

create or replace function review_leave(p_id uuid, p_approve boolean, p_note text default null) returns absences
language plpgsql security definer set search_path = public as $$
declare
  v_row absences;
begin
  if not is_admin() then
    raise exception 'רק מנהל יכול לאשר בקשות חופשה';
  end if;

  update absences set
    status = case when p_approve then 'approved' else 'rejected' end,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    review_note = p_note
  where id = p_id and status = 'pending'
  returning * into v_row;

  if v_row is null then
    raise exception 'בקשה לא נמצאה או שכבר טופלה';
  end if;

  perform log_audit(case when p_approve then 'approve_leave' else 'reject_leave' end, 'absences', v_row.id, null, to_jsonb(v_row));
  return v_row;
end;
$$;

-- ===================== RPC: נעילת/פתיחת חודש =====================

create or replace function close_month(p_year int, p_month int) returns monthly_locks
language plpgsql security definer set search_path = public as $$
declare
  v_row monthly_locks;
begin
  if not is_admin() then
    raise exception 'רק מנהל יכול לסגור חודש';
  end if;

  insert into monthly_locks (year, month, locked, locked_by, locked_at)
  values (p_year, p_month, true, auth.uid(), now())
  on conflict (year, month) do update set
    locked = true, locked_by = auth.uid(), locked_at = now(),
    reopened_by = null, reopened_at = null
  returning * into v_row;

  perform log_audit('close_month', 'monthly_locks', v_row.id, null, to_jsonb(v_row));
  return v_row;
end;
$$;

create or replace function reopen_month(p_year int, p_month int) returns monthly_locks
language plpgsql security definer set search_path = public as $$
declare
  v_row monthly_locks;
begin
  if not is_admin() then
    raise exception 'רק מנהל יכול לפתוח חודש מחדש';
  end if;

  update monthly_locks set locked = false, reopened_by = auth.uid(), reopened_at = now()
  where year = p_year and month = p_month
  returning * into v_row;

  if v_row is null then
    raise exception 'החודש לא נמצא כנעול';
  end if;

  perform log_audit('reopen_month', 'monthly_locks', v_row.id, null, to_jsonb(v_row));
  return v_row;
end;
$$;

-- ===================== RPC: עדכון הגדרות =====================

create or replace function update_setting(p_key text, p_value jsonb) returns settings
language plpgsql security definer set search_path = public as $$
declare
  v_row settings;
  v_old jsonb;
begin
  if not is_admin() then
    raise exception 'רק מנהל יכול לעדכן הגדרות';
  end if;

  select value into v_old from settings where key = p_key;

  insert into settings (key, value, updated_by, updated_at)
  values (p_key, p_value, auth.uid(), now())
  on conflict (key) do update set value = p_value, updated_by = auth.uid(), updated_at = now()
  returning * into v_row;

  perform log_audit('update_setting', 'settings', null, jsonb_build_object('key', p_key, 'value', v_old), jsonb_build_object('key', p_key, 'value', p_value));
  return v_row;
end;
$$;

-- מנהל: עדכון ישיר של שורת נוכחות (עריכה ידנית מלאה)
create or replace function admin_upsert_attendance(
  p_id uuid, p_employee_id uuid, p_work_date date, p_clock_in timestamptz, p_clock_out timestamptz, p_notes text default null
) returns attendance
language plpgsql security definer set search_path = public as $$
declare
  v_row attendance;
  v_old jsonb;
begin
  if not is_admin() then
    raise exception 'רק מנהל יכול לערוך נוכחות ישירות';
  end if;

  if p_id is null then
    insert into attendance (employee_id, work_date, clock_in, clock_out, source, notes)
    values (p_employee_id, p_work_date, p_clock_in, p_clock_out, 'admin', p_notes)
    returning * into v_row;
    perform log_audit('admin_create_attendance', 'attendance', v_row.id, null, to_jsonb(v_row));
  else
    select to_jsonb(a) into v_old from attendance a where id = p_id;
    update attendance set
      work_date = p_work_date, clock_in = p_clock_in, clock_out = p_clock_out,
      notes = p_notes, source = 'admin'
    where id = p_id
    returning * into v_row;
    perform log_audit('admin_update_attendance', 'attendance', v_row.id, v_old, to_jsonb(v_row));
  end if;

  return v_row;
end;
$$;
