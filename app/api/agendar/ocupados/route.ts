import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseDuracaoDoServico, slotsOcupadosPor } from '@/lib/agenda'

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

  // Generate all 30-min slots covered by each booking's duration
  const bloqueados = new Set<string>()
  for (const row of rows ?? []) {
    const d        = new Date(row.data_hora)
    const startMin = d.getUTCHours() * 60 + d.getUTCMinutes()
    for (const slot of slotsOcupadosPor(startMin, parseDuracaoDoServico(row.servico ?? ''))) {
      bloqueados.add(slot)
    }
  }

  return NextResponse.json({ ocupados: [...bloqueados] })
}
