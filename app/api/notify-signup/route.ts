import { NextRequest, NextResponse } from 'next/server'

function formatarTelefone(tel: string): string {
  const digits = tel.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length >= 12) return digits
  return '55' + digits
}

export async function POST(req: NextRequest) {
  const ownerPhone  = process.env.OWNER_PHONE
  const instanceId  = process.env.ZAPI_INSTANCE_ID
  const token       = process.env.ZAPI_TOKEN
  const clientToken = process.env.ZAPI_CLIENT_TOKEN

  if (!ownerPhone || !instanceId || !token) {
    return NextResponse.json({ ok: false, error: 'Notificação não configurada' })
  }

  const { nome, tipo, email } = await req.json().catch(() => ({}))

  const mensagem = `Novo cadastro no Marcaí!\n\nNegócio: ${nome ?? '—'}\nTipo: ${tipo ?? '—'}\nEmail: ${email ?? '—'}`

  try {
    const res = await fetch(
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
    if (!res.ok) console.error('[notify-signup] Z-API error:', await res.text())
  } catch (err) {
    console.error('[notify-signup] failed:', err)
  }

  return NextResponse.json({ ok: true })
}
