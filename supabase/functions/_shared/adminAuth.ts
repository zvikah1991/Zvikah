import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

/** מוודא שהקורא הוא מנהל מחובר, לפי ה-JWT שהתקבל בבקשה. זורק Response אם לא. */
export async function requireAdmin(req: Request): Promise<{ userId: string; admin: SupabaseClient }> {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace('Bearer ', '');
  const admin = serviceClient();

  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData.user) {
    throw new Response(JSON.stringify({ error: 'לא מאומת' }), { status: 401 });
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    throw new Response(JSON.stringify({ error: 'רק מנהל רשאי לבצע פעולה זו' }), { status: 403 });
  }

  return { userId: userData.user.id, admin };
}

export function randomTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  const bytes = new Uint32Array(14);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}
