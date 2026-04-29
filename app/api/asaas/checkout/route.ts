import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getOrCreateCustomer, createSubscription, getSubscriptionPaymentUrl } from '@/lib/asaas'

const PLANOS_VALIDOS = ['basico', 'pro', 'prime'] as const

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: { plano?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid_body' }, { status: 400 }) }

  const { plano } = body
  if (!plano || !(PLANOS_VALIDOS as readonly string[]).includes(plano)) {
    return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
  }

  const { data: neg, error: negError } = await supabase
    .from('negocios')
    .select('id, cpf, asaas_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (negError) {
    console.error('[checkout] negocio query error:', negError)
    return NextResponse.json({ error: `DB error: ${negError.message}` }, { status: 500 })
  }
  if (!neg) return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 })

  const cpf = (neg.cpf ?? '').replace(/\D/g, '')
  if (cpf.length < 11) {
    return NextResponse.json({ error: 'cpf_required' }, { status: 422 })
  }

  const nome = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? ''

  try {
    let customerId: string = neg.asaas_customer_id
    if (!customerId) {
      customerId = await getOrCreateCustomer(user.email!, nome, cpf)
      await supabase.from('negocios').update({ asaas_customer_id: customerId }).eq('id', neg.id)
    }

    const subscriptionId = await createSubscription(customerId, plano)
    await supabase.from('negocios').update({ asaas_subscription_id: subscriptionId }).eq('id', neg.id)

    const paymentUrl = await getSubscriptionPaymentUrl(subscriptionId)
    if (!paymentUrl) throw new Error('URL de pagamento não gerada pelo Asaas')

    return NextResponse.json({ paymentUrl })
  } catch (err: unknown) {
    console.error('[asaas/checkout]', err)
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
