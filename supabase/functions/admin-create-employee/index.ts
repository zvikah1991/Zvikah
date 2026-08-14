import { corsHeaders } from '../_shared/cors.ts';
import { requireAdmin, randomTempPassword } from '../_shared/adminAuth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { admin } = await requireAdmin(req);
    const body = await req.json();

    const {
      email, full_name, phone, job_title, hire_date,
      employment_type, hourly_wage, employment_scope,
    } = body;

    if (!email || !full_name) {
      return new Response(JSON.stringify({ error: 'חסרים שדות חובה: אימייל ושם מלא' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tempPassword = randomTempPassword();

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name, role: 'employee' },
    });

    if (createErr || !created.user) {
      return new Response(JSON.stringify({ error: createErr?.message ?? 'יצירת המשתמש נכשלה' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: profileErr } = await admin
      .from('profiles')
      .update({
        phone, job_title, hire_date, employment_type,
        hourly_wage, employment_scope, must_change_password: true,
      })
      .eq('id', created.user.id);

    if (profileErr) {
      return new Response(JSON.stringify({ error: profileErr.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ userId: created.user.id, tempPassword }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
