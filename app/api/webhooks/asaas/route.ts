import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { planoFromSubscription } from '@/lib/asaas'

// Asaas envia o token no header asaas-access-token
function isValidToken(req: NextRequest): boolean {
  const token = req.headers.get('asaas-access-token')
  return token === process.env.ASAAS_WEBHOOK_TOKEN
}

// Ativa ou atualiza o plano pago a partir da descrição da assinatura
const EVENTOS_ATIVAR = new Set([
  'PAYMENT_CONFIRMED',     // cartão
  'PAYMENT_RECEIVED',      // boleto / Pix
  'SUBSCRIPTION_UPDATED',  // upgrade ou downgrade de plano
])

// Rebaixa para gratuito
const EVENTOS_REBAIXAR = new Set([
  'PAYMENT_OVERDUE',
  'PAYMENT_REFUNDED',
  'PAYMENT_DELETED',
  'SUBSCRIPTION_DELETED',
  'SUBSCRIPTION_INACTIVATED',
])

// Recebidos e registrados, sem efeito no plano
const EVENTOS_IGNORADOS = new Set([
  'SUBSCRIPTION_CREATED',  // plano já é definido no checkout via lib/asaas.ts
])

type AsaasPayment = {
  subscription?: string
  description?: string
}

type AsaasWebhookPayload = {
  event: string
  payment?: AsaasPayment
  subscription?: { id: string; description?: string }
}

// Idempotente: grava sempre o mesmo valor para o mesmo evento repetido
async function setPlano(
  supabase: SupabaseClient,
  subscriptionId: string,
  plano: string,
  event: string
): Promise<void> {
  const { error, count } = await supabase
    .from('negocios')
    .update({ plano }, { count: 'exact' })
    .eq('asaas_subscription_id', subscriptionId)

  if (error) {
    console.error(`[asaas-webhook] ${event}: falha ao gravar plano=${plano}`, error)
    return
  }
  if (count === 0) {
    console.warn(`[asaas-webhook] ${event}: nenhum negocio com asaas_subscription_id=${subscriptionId}`)
    return
  }
  console.log(`[asaas-webhook] ${event}: plano=${plano} (${count} registro)`)
}

export async function POST(req: NextRequest) {
  if (!isValidToken(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let payload: AsaasWebhookPayload
  try {
    payload = await req.json()
  } catch {
    // Corpo inválido não melhora em retentativa: responde 200 para o Asaas não reenfileirar
    console.warn('[asaas-webhook] corpo inválido, ignorado')
    return NextResponse.json({ ok: true })
  }

  const { event } = payload

  // Extrair subscription ID e descrição do plano
  const subscriptionId = payload.payment?.subscription ?? payload.subscription?.id
  if (!subscriptionId) {
    console.log(`[asaas-webhook] ${event}: sem subscription id, ignorado`)
    return NextResponse.json({ ok: true })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (EVENTOS_ATIVAR.has(event)) {
    // Determinar plano pela descrição da assinatura
    const desc = payload.subscription?.description ?? payload.payment?.description ?? ''
    const plano = planoFromSubscription(desc)

    if (plano === 'gratuito') {
      // Descrição sem plano reconhecível: não rebaixa por engano
      console.warn(`[asaas-webhook] ${event}: plano não reconhecido em "${desc}"`)
    } else {
      await setPlano(supabase, subscriptionId, plano, event)
    }
  } else if (EVENTOS_REBAIXAR.has(event)) {
    await setPlano(supabase, subscriptionId, 'gratuito', event)
  } else if (EVENTOS_IGNORADOS.has(event)) {
    console.log(`[asaas-webhook] ${event}: no-op (plano definido no checkout)`)
  } else {
    console.log(`[asaas-webhook] evento não tratado: ${event}`)
  }

  return NextResponse.json({ ok: true })
}
