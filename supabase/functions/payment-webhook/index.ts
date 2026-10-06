import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  const expectedToken = Deno.env.get('MAYAR_WEBHOOK_SECRET');
  if (!expectedToken || token !== expectedToken) {
    console.log('WEBHOOK DITOLAK: token salah atau kosong');
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const bodyText = await req.text();
    const payload = JSON.parse(bodyText);
    const data = payload.data || payload;

    const status = data.status || data.transactionStatus;

    if (status === 'SETTLED' || status === 'SUCCESS' || status === 'PAID') {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const emailPembeli = data.customerEmail;

      if (emailPembeli) {
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
        if (usersData?.users) {
          const matchedUser = usersData.users.find(u => u.email === emailPembeli);

          if (matchedUser) {
            await supabaseAdmin.from('profiles').update({ is_paid: true }).eq('id', matchedUser.id);
            console.log(`SUKSES: Gembok dibuka untuk email: ${emailPembeli}`);
          } else {
            console.log(`GAGAL: Email ${emailPembeli} sudah bayar, tapi tidak ditemukan di database.`);
          }
        }
      } else {
        console.log("Email pembeli tidak ditemukan di payload.");
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' }});
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
})