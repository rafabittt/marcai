import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

function formatarTelefone(tel: string): string {
  const digits = tel.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length >= 12) return digits
  return '55' + digits
}

export async function POST(req: NextRequest) {
  let texto: string
  try {
    const body = await req.json()
    texto = String(body.texto ?? '').trim().slice(0, 500)
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
  }

  if (!texto) {
    return NextResponse.json({ error: 'Texto obrigatório' }, { status: 400 })
  }

  // Identify sender via session cookie (best-effort)
  let negocioNome: string | null = null
  try {
    const cookieStore = await cookies()
    const supabaseUser = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    )
    const { data: { user } } = await supabaseUser.auth.getUser()
    if (user) {
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const { data: neg } = await admin
        .from('negocios')
        .select('nome')
        .eq('user_id', user.id)
        .maybeSingle()
      negocioNome = neg?.nome ?? null
    }
  } catch { /* no session = anonymous */ }

  // Save to Supabase
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  await admin.from('sugestoes').insert({ negocio_nome: negocioNome, texto })

  // WhatsApp notification to owner
  const ownerPhone  = process.env.OWNER_PHONE
  const instanceId  = process.env.ZAPI_INSTANCE_ID
  const token       = process.env.ZAPI_TOKEN
  const clientToken = process.env.ZAPI_CLIENT_TOKEN

  if (ownerPhone && instanceId && token) {
    const de = negocioNome ? `De: ${negocioNome}\n\n` : ''
    const mensagem = `💡 Nova sugestão no Marcaí!\n\n${de}${texto}`
    try {
      await fetch(
        `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(clientToken ? { 'Client-Token': clientToken } : {}),
          },
          body: JSON.stringify({ phone: formatarTelefone(ownerPhone), message: mensagem }),
        }
      )
    } catch (err) {
      console.error('[sugestao] WhatsApp failed:', err)
    }
  }

  return NextResponse.json({ ok: true })
}
