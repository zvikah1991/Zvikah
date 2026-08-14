import { supabase } from './supabase';

async function invoke<T>(name: string, body: object): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    const message = (data as { error?: string } | null)?.error ?? error.message;
    throw new Error(message);
  }
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    throw new Error(String((data as { error: string }).error));
  }
  return data as T;
}

export interface CreateEmployeeInput {
  email: string;
  full_name: string;
  phone?: string;
  job_title?: string;
  hire_date?: string;
  employment_type: 'hourly' | 'monthly' | 'contractor';
  hourly_wage?: number;
  employment_scope?: number;
}

export function adminCreateEmployee(input: CreateEmployeeInput) {
  return invoke<{ userId: string; tempPassword: string }>('admin-create-employee', input);
}

export function adminSetEmployeeActive(employeeId: string, active: boolean) {
  return invoke<{ ok: true }>('admin-set-employee-active', { employeeId, active });
}

export function adminResetPassword(employeeId: string) {
  return invoke<{ tempPassword: string }>('admin-reset-password', { employeeId });
}
