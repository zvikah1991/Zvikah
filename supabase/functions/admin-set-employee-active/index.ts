import { corsHeaders } from '../_shared/cors.ts';
import { requireAdmin } from '../_shared/adminAuth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { admin } = await requireAdmin(req);
    const { employeeId, active } = await req.json();

    if (!employeeId || typeof active !== 'boolean') {
      return new Response(JSON.stringify({ error: 'פרמטרים חסרים' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: profileErr } = await admin
      .from('profiles')
      .update({ active })
      .eq('id', employeeId);

    if (profileErr) {
      return new Response(JSON.stringify({ error: profileErr.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: banErr } = await admin.auth.admin.updateUserById(employeeId, {
      ban_duration: active ? 'none' : '876000h',
    });

    if (banErr) {
      return new Response(JSON.stringify({ error: banErr.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
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
