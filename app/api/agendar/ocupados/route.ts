import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseDuracaoDoServico, slotsOcupadosPor, getBuffer, type HorariosMap } from '@/lib/agenda'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const negocioId      = searchParams.get('negocio_id')
  const data           = searchParams.get('data') // YYYY-MM-DD
  const profissionalId = searchParams.get('profissional_id')

  if (!negocioId || !data) {
    return NextResponse.json({ error: 'missing_params' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Buffer configurado pelo negócio — some ao tempo reservado de cada
  // atendimento, para dar folga entre um cliente e o próximo.
  const { data: neg } = await supabase
    .from('negocios')
    .select('horarios')
    .eq('id', negocioId)
    .maybeSingle()
  const buffer = getBuffer(neg?.horarios as HorariosMap | null)

  // Resolve professional name for filtering
  let profissionalNome: string | null = null
  if (profissionalId) {
    const { data: prof } = await supabase
      .from('profissionais')
      .select('nome')
      .eq('id', profissionalId)
      .maybeSingle()
    profissionalNome = prof?.nome ?? null
  }

  const iniciodia = `${data}T00:00:00.000Z`
  const fimDia    = `${data}T23:59:59.999Z`

  let query = supabase
    .from('agendamentos')
    .select('data_hora, servico')
    .eq('negocio_id', negocioId)
    .neq('status', 'cancelado')
    .gte('data_hora', iniciodia)
    .lte('data_hora', fimDia)

  if (profissionalNome) {
    query = query.eq('profissional', profissionalNome)
  }

  const { data: rows } = await query

  // Gera todos os slots de 30min cobertos pela duração do agendamento + buffer
  const bloqueados = new Set<string>()
  for (const row of rows ?? []) {
    const d        = new Date(row.data_hora)
    const startMin = d.getUTCHours() * 60 + d.getUTCMinutes()
    const duracao  = parseDuracaoDoServico(row.servico ?? '') + buffer
    for (const slot of slotsOcupadosPor(startMin, duracao)) {
      bloqueados.add(slot)
    }
  }

  return NextResponse.json({ ocupados: [...bloqueados] })
}
