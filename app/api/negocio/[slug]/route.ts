import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // Anon key de propósito: esta rota só devolve dados públicos, e a view
  // negocios_publico é o único caminho de leitura liberado para o role anon.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Lê da VIEW, nunca da tabela `negocios`: a tabela tem cpf, telefone do dono,
  // user_id e os ids do Asaas, que não podem sair numa resposta pública.
  // RLS não resolveria — ela filtra linhas, não colunas. Ver scripts/sql/.
  const { data: neg, error: negError } = await supabase
    .from('negocios_publico')
    .select('id, nome, slug, endereco, horarios, exigir_cadastro_cliente')
    .eq('slug', slug)
    .single()

  if (negError || !neg) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const [{ data: servicos }, { data: profissionais }] = await Promise.all([
    supabase.from('servicos').select('id, nome, duracao, profissional_id').eq('negocio_id', neg.id),
    supabase.from('profissionais').select('id, nome, cargo').eq('negocio_id', neg.id),
  ])

  return NextResponse.json({
    negocio: neg,
    servicos: servicos ?? [],
    profissionais: profissionais ?? [],
  })
}
