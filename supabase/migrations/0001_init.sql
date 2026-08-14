-- Ayalon Kedem Time — סכמת בסיס נתונים ראשית
-- הרץ בקובץ הזה דרך Supabase SQL Editor או supabase db push (כולל 0002).

create extension if not exists pgcrypto;

create type user_role as enum ('admin','employee');
create type employment_type as enum ('hourly','monthly','contractor');
create type request_status as enum ('pending','approved','rejected');
create type absence_type as enum ('vacation','sick','military','holiday','other');

-- ========== profiles ==========
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  role user_role not null default 'employee',
  job_title text,
  hire_date date,
  employment_type employment_type not null default 'hourly',
  hourly_wage numeric(10,2),
  employment_scope numeric(5,2) default 100,
  active boolean not null default true,
  must_change_password boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on profiles
  for each row execute function set_updated_at();

-- יצירת פרופיל אוטומטית עם הרשמת משתמש (משמש את admin-create-employee)
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'employee')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ========== attendance ==========
create table attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references profiles(id) on delete cascade,
  work_date date not null,
  clock_in timestamptz not null,
  clock_out timestamptz,
  source text not null default 'self' check (source in ('self','correction','admin')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index attendance_employee_date_idx on attendance(employee_id, work_date);
create unique index attendance_one_open_per_employee on attendance(employee_id) where (clock_out is null);

create trigger attendance_set_updated_at before update on attendance
  for each row execute function set_updated_at();

-- ========== breaks ==========
create table breaks (
  id uuid primary key default gen_random_uuid(),
  attendance_id uuid not null references attendance(id) on delete cascade,
  break_start timestamptz not null,
  break_end timestamptz,
  created_at timestamptz not null default now()
);

create unique index breaks_one_open_per_attendance on breaks(attendance_id) where (break_end is null);
create index breaks_attendance_idx on breaks(attendance_id);

-- ========== attendance_corrections ==========
create table attendance_corrections (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references profiles(id) on delete cascade,
  work_date date not null,
  requested_clock_in time,
  requested_clock_out time,
  reason text not null,
  original_clock_in timestamptz,
  original_clock_out timestamptz,
  status request_status not null default 'pending',
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now()
);

create index corrections_employee_idx on attendance_corrections(employee_id);
create index corrections_status_idx on attendance_corrections(status);

-- ========== absences (חופשה/מחלה/מילואים/חג/אחר) ==========
create table absences (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references profiles(id) on delete cascade,
  type absence_type not null,
  start_date date not null,
  end_date date not null,
  reason text,
  attachment_path text,
  status request_status not null default 'pending',
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  constraint absences_valid_range check (end_date >= start_date)
);

create index absences_employee_idx on absences(employee_id);
create index absences_status_idx on absences(status);

-- ========== monthly_locks ==========
create table monthly_locks (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  month int not null check (month between 1 and 12),
  locked boolean not null default true,
  locked_by uuid references profiles(id),
  locked_at timestamptz default now(),
  reopened_by uuid references profiles(id),
  reopened_at timestamptz,
  unique(year, month)
);

-- ========== audit_logs ==========
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx on audit_logs(entity_type, entity_id);
create index audit_logs_created_idx on audit_logs(created_at desc);

-- ========== settings ==========
create table settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles(id)
);

insert into settings (key, value) values
  ('payroll_rules', '{
    "standardDailyHours": 8,
    "standardWeeklyHours": 42,
    "overtimeTier1Rate": 1.25,
    "overtimeTier1Hours": 2,
    "overtimeTier2Rate": 1.5,
    "breaksArePaid": false,
    "minBreakMinutesUnpaid": 30
  }'::jsonb),
  ('company_info', '{
    "name": "Ayalon Kedem",
    "timezone": "Asia/Jerusalem"
  }'::jsonb);
