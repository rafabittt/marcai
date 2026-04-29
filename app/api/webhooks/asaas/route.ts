import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Asaas envia o token no header asaas-access-token
function isValidToken(req: NextRequest): boolean {
  const token = req.headers.get('asaas-access-token')
  return token === process.env.ASAAS_WEBHOOK_TOKEN
}

type AsaasPayment = {
  subscription?: string
  description?: string
}

type AsaasWebhookPayload = {
  event: string
  payment?: AsaasPayment
  subscription?: { id: string; description?: string }
}

export async function POST(req: NextRequest) {
  if (!isValidToken(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let payload: AsaasWebhookPayload
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const { event } = payload

  // Extrair subscription ID e descrição do plano
  const subscriptionId = payload.payment?.subscription ?? payload.subscription?.id
  if (!subscriptionId) return NextResponse.json({ ok: true })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  if (event === 'PAYMENT_CONFIRMED') {
    // Determinar plano pela descrição da assinatura
    const desc = (payload.subscription?.description ?? payload.payment?.description ?? '').toLowerCase()
    let plano = 'gratuito'
    if (desc.includes('prime')) plano = 'prime'
    else if (desc.includes('pro')) plano = 'pro'
    else if (desc.includes('básico') || desc.includes('basico')) plano = 'basico'

    if (plano !== 'gratuito') {
      await supabase
        .from('negocios')
        .update({ plano })
        .eq('asaas_subscription_id', subscriptionId)
    }
  }

  if (event === 'PAYMENT_OVERDUE' || event === 'SUBSCRIPTION_DELETED') {
    await supabase
      .from('negocios')
      .update({ plano: 'gratuito' })
      .eq('asaas_subscription_id', subscriptionId)
  }

  return NextResponse.json({ ok: true })
}
