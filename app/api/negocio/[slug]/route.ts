import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: neg, error: negError } = await supabase
    .from('negocios')
    .select('id, nome, slug, telefone, endereco, horarios')
    .eq('slug', slug)
    .single()

  if (negError || !neg) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const [{ data: servicos }, { data: profissionais }] = await Promise.all([
    supabase.from('servicos').select('id, nome, duracao').eq('negocio_id', neg.id),
    supabase.from('profissionais').select('id, nome, cargo').eq('negocio_id', neg.id),
  ])

  return NextResponse.json({
    negocio: neg,
    servicos: servicos ?? [],
    profissionais: profissionais ?? [],
  })
}
