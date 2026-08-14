import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { DEFAULT_PAYROLL_RULES } from '../lib/payroll';
import type { CompanyInfo, PayrollRules } from '../types/database';

export function usePayrollRules() {
  return useQuery({
    queryKey: ['settings', 'payroll_rules'],
    queryFn: async (): Promise<PayrollRules> => {
      const { data, error } = await supabase.from('settings').select('value').eq('key', 'payroll_rules').single();
      if (error) return DEFAULT_PAYROLL_RULES;
      return { ...DEFAULT_PAYROLL_RULES, ...(data.value as Partial<PayrollRules>) };
    },
    staleTime: 60_000,
  });
}

export function useCompanyInfo() {
  return useQuery({
    queryKey: ['settings', 'company_info'],
    queryFn: async (): Promise<CompanyInfo> => {
      const { data, error } = await supabase.from('settings').select('value').eq('key', 'company_info').single();
      if (error) return { name: 'Ayalon Kedem', timezone: 'Asia/Jerusalem' };
      return data.value as CompanyInfo;
    },
    staleTime: 60_000,
  });
}
