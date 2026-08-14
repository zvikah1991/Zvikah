export type UserRole = 'admin' | 'employee';
export type EmploymentType = 'hourly' | 'monthly' | 'contractor';
export type RequestStatus = 'pending' | 'approved' | 'rejected';
export type AbsenceType = 'vacation' | 'sick' | 'military' | 'holiday' | 'other';
export type AttendanceSource = 'self' | 'correction' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  role: UserRole;
  job_title: string | null;
  hire_date: string | null;
  employment_type: EmploymentType;
  hourly_wage: number | null;
  employment_scope: number | null;
  active: boolean;
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  employee_id: string;
  work_date: string;
  clock_in: string;
  clock_out: string | null;
  source: AttendanceSource;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BreakRow {
  id: string;
  attendance_id: string;
  break_start: string;
  break_end: string | null;
  created_at: string;
}

export interface AttendanceCorrection {
  id: string;
  employee_id: string;
  work_date: string;
  requested_clock_in: string | null;
  requested_clock_out: string | null;
  reason: string;
  original_clock_in: string | null;
  original_clock_out: string | null;
  status: RequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
}

export interface Absence {
  id: string;
  employee_id: string;
  type: AbsenceType;
  start_date: string;
  end_date: string;
  reason: string | null;
  attachment_path: string | null;
  status: RequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
}

export interface MonthlyLock {
  id: string;
  year: number;
  month: number;
  locked: boolean;
  locked_by: string | null;
  locked_at: string | null;
  reopened_by: string | null;
  reopened_at: string | null;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: unknown;
  new_value: unknown;
  created_at: string;
}

export interface PayrollRules {
  standardDailyHours: number;
  standardWeeklyHours: number;
  overtimeTier1Rate: number;
  overtimeTier1Hours: number;
  overtimeTier2Rate: number;
  breaksArePaid: boolean;
  minBreakMinutesUnpaid: number;
}

export interface CompanyInfo {
  name: string;
  timezone: string;
}

export interface SettingsRow {
  key: string;
  value: unknown;
  updated_at: string;
  updated_by: string | null;
}

// Minimal typed surface used with the Supabase client's generic. We don't
// generate the full Database type from the CLI in this environment, so this
// intentionally covers only what the app queries directly.
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      attendance: { Row: Attendance; Insert: Partial<Attendance>; Update: Partial<Attendance> };
      breaks: { Row: BreakRow; Insert: Partial<BreakRow>; Update: Partial<BreakRow> };
      attendance_corrections: {
        Row: AttendanceCorrection;
        Insert: Partial<AttendanceCorrection>;
        Update: Partial<AttendanceCorrection>;
      };
      absences: { Row: Absence; Insert: Partial<Absence>; Update: Partial<Absence> };
      monthly_locks: { Row: MonthlyLock; Insert: Partial<MonthlyLock>; Update: Partial<MonthlyLock> };
      audit_logs: { Row: AuditLog; Insert: Partial<AuditLog>; Update: Partial<AuditLog> };
      settings: { Row: SettingsRow; Insert: Partial<SettingsRow>; Update: Partial<SettingsRow> };
    };
  };
}
