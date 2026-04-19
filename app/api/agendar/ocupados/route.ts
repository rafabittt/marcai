import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const negocioId = searchParams.get('negocio_id')
  const data      = searchParams.get('data') // YYYY-MM-DD

  if (!negocioId || !data) {
    return NextResponse.json({ error: 'missing_params' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const iniciodia = `${data}T00:00:00.000Z`
  const fimDia    = `${data}T23:59:59.999Z`

  const { data: rows } = await supabase
    .from('agendamentos')
    .select('data_hora')
    .eq('negocio_id', negocioId)
    .neq('status', 'cancelado')
    .gte('data_hora', iniciodia)
    .lte('data_hora', fimDia)

  const ocupados = (rows ?? []).map(r => {
    const d = new Date(r.data_hora)
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
  })

  return NextResponse.json({ ocupados })
}
