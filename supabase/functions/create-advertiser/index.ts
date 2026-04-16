import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const LOOPIN_TV_URL = 'https://sxsmirhqbslmvyesikgg.supabase.co'
const LOOPIN_TV_KEY = Deno.env.get('LOOPIN_TV_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  try {
    const { clientId, name, email, phone, segment, contactName } = await req.json()

    if (!clientId || !name) {
      return new Response(
        JSON.stringify({ success: false, error: 'clientId e name são obrigatórios' }),
        { headers: { 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const loopinTv = createClient(LOOPIN_TV_URL, LOOPIN_TV_KEY)

    const { data, error } = await loopinTv.from('advertisers').upsert({
      id: clientId,
      name: name,
      contact_name: contactName || name,
      contact_email: email || null,
      contact_phone: phone || null,
      category: segment || null,
      created_at: new Date().toISOString(),
    }, { onConflict: 'id' })

    if (error) {
      console.error('Erro ao criar advertiser:', error)
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { headers: { 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({ success: true, advertiserId: clientId }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
