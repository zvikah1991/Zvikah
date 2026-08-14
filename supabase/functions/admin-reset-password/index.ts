import { corsHeaders } from '../_shared/cors.ts';
import { requireAdmin, randomTempPassword } from '../_shared/adminAuth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { admin } = await requireAdmin(req);
    const { employeeId } = await req.json();

    if (!employeeId) {
      return new Response(JSON.stringify({ error: 'חסר מזהה עובד' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tempPassword = randomTempPassword();

    const { error: updateErr } = await admin.auth.admin.updateUserById(employeeId, {
      password: tempPassword,
    });

    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await admin.from('profiles').update({ must_change_password: true }).eq('id', employeeId);

    return new Response(JSON.stringify({ tempPassword }), {
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
