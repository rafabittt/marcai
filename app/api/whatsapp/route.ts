import { NextRequest, NextResponse } from 'next/server'

function formatarTelefone(tel: string): string {
  const digits = tel.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length >= 12) return digits
  return '55' + digits
}

export async function POST(req: NextRequest) {
  const { telefone, mensagem } = await req.json()

  const instanceId = process.env.ZAPI_INSTANCE_ID
  const token = process.env.ZAPI_TOKEN
  const clientToken = process.env.ZAPI_CLIENT_TOKEN

  if (!instanceId || !token) {
    return NextResponse.json({ error: 'Z-API não configurada' }, { status: 500 })
  }

  if (!telefone || !mensagem) {
    return NextResponse.json({ error: 'telefone e mensagem são obrigatórios' }, { status: 400 })
  }

  const phone = formatarTelefone(telefone)
  const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(clientToken ? { 'Client-Token': clientToken } : {}),
    },
    body: JSON.stringify({ phone, message: mensagem }),
  })

  if (!res.ok) {
    const body = await res.text()
    return NextResponse.json({ error: 'Erro ao enviar mensagem', detail: body }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json({ ok: true, data })
}
