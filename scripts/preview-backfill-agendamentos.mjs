// ─────────────────────────────────────────────────────────────────────────────
// FASE 1, ETAPA 3 — preview do backfill dos agendamentos. NÃO GRAVA NADA.
//
// Três colunas ficaram nulas na migração e precisam de decisão antes de
// qualquer escrita: profissional_id, duracao_min e preco. Nada é chutado —
// cada caso sem resposta clara é listado.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'
import { parseDuracaoDoServico } from '../lib/agenda.ts'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.error('Use --env-file=.env.local'); process.exit(1) }
const db = createClient(url, key, { auth: { persistSession: false } })

const [{ data: ags }, { data: profs }, { data: srvs }] = await Promise.all([
  db.from('agendamentos').select('id, cliente_nome, servico, profissional, profissional_id, duracao_min, preco, data_hora, status, negocio_id').order('data_hora'),
  db.from('profissionais').select('id, nome, negocio_id'),
  db.from('servicos').select('id, nome, duracao, preco, negocio_id'),
])

const bar = (t) => { console.log('\n' + '═'.repeat(78)); console.log(t); console.log('═'.repeat(78)) }
const d = (a) => a.data_hora.slice(0, 10)

console.log(`\nPREVIEW — nada será gravado.  ${ags.length} agendamentos.\n`)

// ── (a) duracao_min ──────────────────────────────────────────────────────────
// A duração hoje é regex no TEXTO do serviço. Sem parênteses, parseDuracaoDoServico
// devolve 30 por default — é justamente esse default silencioso que não pode virar dado.
const TEM_PARENTESES = /\(([^)]+)\)\s*$/

bar('(a) duracao_min — a partir do texto do serviço')
const comDuracao = ags.filter(a => TEM_PARENTESES.test(a.servico ?? ''))
const semDuracao = ags.filter(a => !TEM_PARENTESES.test(a.servico ?? ''))

console.log(`\n  ${comDuracao.length} com duração no texto — dá para preencher sem chute:\n`)
const porTexto = {}
for (const a of comDuracao) {
  const k = a.servico
  porTexto[k] = porTexto[k] ?? { n: 0, min: parseDuracaoDoServico(a.servico) }
  porTexto[k].n++
}
for (const [txt, v] of Object.entries(porTexto)) {
  console.log(`    ${String(v.n).padStart(2)}x  "${txt}"  ->  duracao_min = ${v.min}`)
}

console.log(`\n  \x1b[33m${semDuracao.length} SEM duração no texto — preencher à mão (hoje caem em 30 min calado):\x1b[0m\n`)
for (const a of semDuracao) {
  console.log(`    ${d(a)}  ${(a.cliente_nome ?? '—').padEnd(14)} serviço: "${a.servico ?? '(vazio)'}"`)
  console.log(`       id=${a.id}`)
}

// ── (b) profissional_id ──────────────────────────────────────────────────────
bar('(b) profissional_id — a partir do nome em agendamentos.profissional')
const porNome = {}
for (const a of ags) {
  const k = a.profissional ?? '(null)'
  porNome[k] = porNome[k] ?? { n: 0, ids: new Set() }
  porNome[k].n++
  const p = profs.find(x => x.nome === a.profissional && x.negocio_id === a.negocio_id)
  if (p) porNome[k].ids.add(p.id)
}
console.log()
for (const [nome, v] of Object.entries(porNome)) {
  const id = [...v.ids][0]
  if (nome === '(null)') continue
  console.log(`    ${String(v.n).padStart(2)}x  "${nome}"  ->  ${id ? 'profissional_id = ' + id : '\x1b[33mNENHUM profissional com esse nome\x1b[0m'}`)
}
const semProf = ags.filter(a => !a.profissional)
console.log(`\n  \x1b[33m${semProf.length} SEM profissional — decidir: atribuir a alguém ou deixar null:\x1b[0m\n`)
for (const a of semProf) {
  console.log(`    ${d(a)}  ${(a.cliente_nome ?? '—').padEnd(14)} ${a.servico ?? ''}  [${a.status}]`)
  console.log(`       id=${a.id}`)
}
console.log('\n  Profissionais disponíveis para atribuir:')
for (const p of profs) console.log(`    ${p.nome}  id=${p.id}`)

// ── (c) preco ────────────────────────────────────────────────────────────────
bar('(c) preco dos agendamentos passados — sua escolha')
console.log(`\n  Situação: ${ags.filter(a => a.preco === null).length}/${ags.length} agendamentos sem preço.`)
console.log('  Preços de tabela hoje:')
for (const s of srvs) console.log(`    ${s.nome.padEnd(12)} ${s.preco === null ? '\x1b[33msem preço cadastrado\x1b[0m' : 'R$ ' + s.preco}`)

// Quanto a opção 2 conseguiria preencher de verdade: casa o texto do serviço
// com o catálogo pelo nome antes dos parênteses.
const nomeDoTexto = (t) => (t ?? '').replace(/\s*\([^)]*\)\s*$/, '').trim()
const casaveis = []
const naoCasaveis = []
for (const a of ags) {
  const nome = nomeDoTexto(a.servico)
  const srv = srvs.find(x => x.nome === nome && x.negocio_id === a.negocio_id)
  if (srv && srv.preco !== null) casaveis.push({ a, srv })
  else naoCasaveis.push({ a, nome, motivo: !srv ? 'serviço não existe no catálogo' : 'serviço sem preço cadastrado' })
}
const totalEstimado = casaveis.reduce((s, c) => s + Number(c.srv.preco), 0)

console.log(`
  OPÇÃO 1 — deixar null, contar faturamento daqui pra frente
    Nada é gravado. O histórico fica sem preço e a aba Desempenho soma só o
    que for agendado depois que o preço entrar no fluxo (Etapa 4).
    A favor: nenhum número inventado numa métrica de dinheiro.
    Contra: os ${ags.length} agendamentos atuais não entram em faturamento nenhum.

  OPÇÃO 2 — estimar pelo preço de tabela de hoje
    Casa o texto do serviço com o catálogo e copia o preço atual.`)

console.log(`
    Cobertura real hoje: \x1b[32m${casaveis.length}\x1b[0m de ${ags.length} agendamentos dá para estimar.`)
const porServico = {}
for (const c of casaveis) {
  porServico[c.srv.nome] = porServico[c.srv.nome] ?? { n: 0, preco: c.srv.preco }
  porServico[c.srv.nome].n++
}
for (const [nome, v] of Object.entries(porServico)) {
  console.log(`      ${String(v.n).padStart(2)}x  ${nome.padEnd(12)} R$ ${v.preco}  =  R$ ${(v.n * Number(v.preco)).toFixed(2)}`)
}
console.log(`      total estimado: \x1b[32mR$ ${totalEstimado.toFixed(2)}\x1b[0m`)
console.log(`\n    \x1b[33m${naoCasaveis.length} ficariam sem preço de qualquer forma:\x1b[0m`)
const motivos = {}
for (const n of naoCasaveis) { const k = `"${n.nome}" — ${n.motivo}`; motivos[k] = (motivos[k] ?? 0) + 1 }
for (const [k, n] of Object.entries(motivos)) console.log(`      ${String(n).padStart(2)}x  ${k}`)

console.log(`
    Contra: é o preço de HOJE aplicado ao passado. Se houver reajuste depois,
    o histórico não muda mais (a coluna é congelada), mas estes ${casaveis.length} já
    nascem com um valor que talvez nunca tenha sido cobrado — que é exatamente
    o que a coluna congelada existe para evitar. E não há como marcar "estimado"
    sem uma coluna nova ou uma convenção.

  Minha recomendação: \x1b[32mOPÇÃO 1\x1b[0m. Os ${ags.length} agendamentos são de teste
  (nomes como "Jaja", "Huhu", "Teste User"), então o faturamento que a opção 2
  produziria — R$ ${totalEstimado.toFixed(2)} — não é receita real que valha preservar.
  Plantar isso na métrica de dinheiro atrapalha mais do que ajuda.
`)

bar('RESUMO — o que preciso de você')
console.log(`
  1. duracao_min dos ${semDuracao.length} sem duração no texto: qual valor para cada?
  2. profissional_id dos ${semProf.length} sem profissional: atribuir a quem, ou null?
  3. preco dos passados: opção 1 ou 2?

  Nada foi gravado.
`)
