const PLAN_VALUES: Record<string, number> = {
  basico: 49,
  pro:    99,
  prime:  299,
}

const PLAN_NAMES: Record<string, string> = {
  basico: 'Marcaí Básico',
  pro:    'Marcaí Pro',
  prime:  'Marcaí Prime',
}

async function req<T = Record<string, unknown>>(path: string, options: RequestInit = {}): Promise<T> {
  const key = '$' + (process.env.ASAAS_API_KEY ?? '')
  const res = await fetch(`${process.env.ASAAS_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      access_token: key,
      ...(options.headers ?? {}),
    },
  })
  const data = await res.json()
  if (!res.ok) {
    const msg = (data as { errors?: { description: string }[] }).errors?.[0]?.description ?? 'Asaas error'
    throw new Error(msg)
  }
  return data as T
}

export async function getOrCreateCustomer(email: string, name: string, cpfCnpj: string): Promise<string> {
  const digits = cpfCnpj.replace(/\D/g, '')
  const search = await req<{ data: { id: string }[] }>(`/customers?cpfCnpj=${digits}`)
  if (search.data?.length > 0) return search.data[0].id

  const customer = await req<{ id: string }>('/customers', {
    method: 'POST',
    body: JSON.stringify({ name, email, cpfCnpj: digits }),
  })
  return customer.id
}

export async function createSubscription(customerId: string, plano: string): Promise<string> {
  const hoje = new Date()
  const nextDueDate = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`

  const sub = await req<{ id: string }>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      customer:    customerId,
      billingType: 'UNDEFINED',
      value:       PLAN_VALUES[plano],
      nextDueDate,
      cycle:       'MONTHLY',
      description: PLAN_NAMES[plano] ?? plano,
    }),
  })
  return sub.id
}

export async function getSubscriptionPaymentUrl(subscriptionId: string): Promise<string | null> {
  const payments = await req<{ data: { invoiceUrl?: string; bankSlipUrl?: string }[] }>(
    `/subscriptions/${subscriptionId}/payments`
  )
  const first = payments.data?.[0]
  return first?.invoiceUrl ?? first?.bankSlipUrl ?? null
}

export function planoFromSubscription(description: string): string {
  const d = description.toLowerCase()
  if (d.includes('prime')) return 'prime'
  if (d.includes('pro'))   return 'pro'
  if (d.includes('básico') || d.includes('basico')) return 'basico'
  return 'gratuito'
}
