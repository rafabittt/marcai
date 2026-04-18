import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function formatarTelefone(tel: string): string {
  const digits = tel.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length >= 12) return digits
  return '55' + digits
}

async function enviarWhatsApp(telefone: string, mensagem: string) {
  const instanceId = process.env.ZAPI_INSTANCE_ID
  const token = process.env.ZAPI_TOKEN
  const clientToken = process.env.ZAPI_CLIENT_TOKEN
  if (!instanceId || !token) return

  try {
    const res = await fetch(
      `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(clientToken ? { 'Client-Token': clientToken } : {}),
        },
        body: JSON.stringify({ phone: formatarTelefone(telefone), message: mensagem }),
      }
    )
    if (!res.ok) console.error('[agendar] Z-API error:', await res.text())
  } catch (err) {
    console.error('[agendar] WhatsApp send failed:', err)
  }
}

export async function POST(req: NextRequest) {
  // Usar anon key — RLS controla INSERT na tabela agendamentos
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  let payload: Record<string, string>
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
  }

  const { slug, nome, telefone, servicoId, profissionalId, data, horario } = payload

  // Validar campos obrigatórios
  if (!slug || !nome?.trim() || !telefone?.trim() || !data || !horario) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
  }

  // Validar telefone (mínimo 10 dígitos)
  if (telefone.replace(/\D/g, '').length < 10) {
    return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 })
  }

  // Validar que data+horário não está no passado
  const dataAgendamento = new Date(`${data}T${horario}`)
  if (isNaN(dataAgendamento.getTime()) || dataAgendamento < new Date()) {
    return NextResponse.json({ error: 'Data ou horário inválido' }, { status: 400 })
  }

  // Buscar negócio pelo slug (validar que existe)
  const { data: neg, error: negError } = await supabase
    .from('negocios')
    .select('id, nome, telefone, plano')
    .eq('slug', slug)
    .single()

  if (negError || !neg) {
    return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 })
  }

  // Verificar limite do plano — server-side (não pode ser bypassado pelo cliente)
  if ((neg.plano ?? 'gratuito') === 'gratuito') {
    const agora = new Date()
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString()
    const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59).toISOString()
    const { count } = await supabase
      .from('agendamentos')
      .select('id', { count: 'exact', head: true })
      .eq('negocio_id', neg.id)
      .gte('data_hora', inicioMes)
      .lte('data_hora', fimMes)

    if ((count ?? 0) >= 5) {
      return NextResponse.json({ error: 'limite_plano' }, { status: 403 })
    }
  }

  // Validar serviço e profissional (devem pertencer ao negócio)
  let servicoTexto = servicoId ?? ''
  let profissionalNome: string | null = null

  if (servicoId && !isNaN(Number(servicoId))) {
    const { data: srv } = await supabase
      .from('servicos')
      .select('nome, duracao')
      .eq('id', Number(servicoId))
      .eq('negocio_id', neg.id)
      .single()
    servicoTexto = srv ? `${srv.nome} (${srv.duracao})` : ''
  }

  if (profissionalId && !isNaN(Number(profissionalId))) {
    const { data: prof } = await supabase
      .from('profissionais')
      .select('nome')
      .eq('id', Number(profissionalId))
      .eq('negocio_id', neg.id)
      .single()
    profissionalNome = prof?.nome ?? null
  }

  // Inserir agendamento
  const { error: insertError } = await supabase.from('agendamentos').insert({
    negocio_id:       neg.id,
    cliente_nome:     nome.trim(),
    cliente_telefone: telefone,
    servico:          servicoTexto,
    profissional:     profissionalNome,
    data_hora:        dataAgendamento.toISOString(),
    status:           'confirmado',
  })

  if (insertError) {
    console.error('[agendar] Insert error:', insertError)
    return NextResponse.json({ error: 'Erro ao realizar agendamento' }, { status: 500 })
  }

  // Notificações WhatsApp — fire-and-forget, server-side
  const dataFormatada = dataAgendamento.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
  const profTexto = profissionalNome ? ` com ${profissionalNome}` : ''

  enviarWhatsApp(
    telefone,
    `Olá ${nome.trim()}! Seu agendamento em ${neg.nome} foi confirmado para ${dataFormatada} às ${horario}${profTexto}. Até lá! 🗓️`
  )

  if (neg.telefone) {
    enviarWhatsApp(
      neg.telefone,
      `Novo agendamento! ${nome.trim()} agendou ${servicoTexto}${profTexto} para ${dataFormatada} às ${horario}. Tel: ${telefone}`
    )
  }

  return NextResponse.json({ ok: true })
}
