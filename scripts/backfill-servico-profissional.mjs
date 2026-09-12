// ─────────────────────────────────────────────────────────────────────────────
// FASE 1.5, ETAPA B — backfill dos vínculos serviço ↔ profissional.
//
// Para cada serviço com `servicos.profissional_id` preenchido, cria a linha
// correspondente em `servico_profissional`. A coluna legada NÃO é tocada: ela
// segue sendo a fonte de verdade até o código apontar para a junção, e removê-la
// é um passo separado, depois disso.
//
// Nada é chutado. Serviço sem profissional, ou apontando para profissional que
// não existe, ou para profissional de OUTRO negócio, é listado para decisão —
// não vira vínculo.
//
// Uso:
//   node --env-file=.env.local scripts/backfill-servico-profissional.mjs           # preview
//   node --env-file=.env.local scripts/backfill-servico-profissional.mjs --apply   # grava
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'

const APPLY = process.argv.includes('--apply')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Use --env-file=.env.local')
  process.exit(1)
}
const db = createClient(url, key, { auth: { persistSession: false } })

const par = (s, p) => `${s}::${p}`

// ── Leitura ──────────────────────────────────────────────────────────────────

const [{ data: negocios }, { data: servicos }, { data: profissionais }, { data: vinculos }] =
  await Promise.all([
    db.from('negocios').select('id, nome, slug').order('nome'),
    db.from('servicos').select('id, negocio_id, nome, duracao, preco, profissional_id').order('nome'),
    db.from('profissionais').select('id, negocio_id, nome').order('nome'),
    db.from('servico_profissional').select('servico_id, profissional_id'),
  ])

const negPorId  = new Map(negocios.map(n => [n.id, n]))
const profPorId = new Map(profissionais.map(p => [p.id, p]))
const jaExiste  = new Set((vinculos ?? []).map(v => par(v.servico_id, v.profissional_id)))

console.log(`\nMODO: ${APPLY ? '\x1b[31mAPPLY (grava no banco)\x1b[0m' : '\x1b[32mPREVIEW (não grava nada)\x1b[0m'}`)
console.log(`serviços: ${servicos.length} | profissionais: ${profissionais.length} | vínculos existentes: ${jaExiste.size}\n`)

// ── Classificação ────────────────────────────────────────────────────────────

const criar = []
const pular = []
const decidir = []

for (const s of servicos) {
  const neg = negPorId.get(s.negocio_id)
  const base = { servico: s, negocioNome: neg?.nome ?? '(negócio desconhecido)' }

  if (!s.profissional_id) {
    decidir.push({ ...base, motivo: 'sem profissional_id — nunca teve vínculo' })
    continue
  }
  const prof = profPorId.get(s.profissional_id)
  if (!prof) {
    decidir.push({ ...base, motivo: `profissional_id ${s.profissional_id} não existe mais (órfão)` })
    continue
  }
  if (prof.negocio_id !== s.negocio_id) {
    decidir.push({ ...base, motivo: `profissional "${prof.nome}" é de OUTRO negócio` })
    continue
  }
  if (jaExiste.has(par(s.id, prof.id))) {
    pular.push({ ...base, prof, motivo: 'vínculo já existe' })
    continue
  }
  criar.push({ ...base, prof })
}

// ── Relatório ────────────────────────────────────────────────────────────────

const linha = (n = 78) => '─'.repeat(n)

console.log('═'.repeat(78))
console.log('ANTES — servico_profissional')
console.log('═'.repeat(78))
if (jaExiste.size === 0) {
  console.log('  (vazia)')
} else {
  for (const v of vinculos) {
    const s = servicos.find(x => x.id === v.servico_id)
    const p = profPorId.get(v.profissional_id)
    console.log(`  ${s?.nome ?? v.servico_id} ←→ ${p?.nome ?? v.profissional_id}`)
  }
}

console.log('\n' + '═'.repeat(78))
console.log('VÍNCULOS A CRIAR')
console.log('═'.repeat(78))
if (criar.length === 0) {
  console.log('  nenhum')
} else {
  let negAtual = null
  for (const c of criar) {
    if (c.negocioNome !== negAtual) { negAtual = c.negocioNome; console.log(`\n  ${negAtual}`) }
    const preco = c.servico.preco === null ? 'sem preço' : `R$ ${c.servico.preco}`
    console.log(`    + ${c.servico.nome.padEnd(16)} (${c.servico.duracao}, ${preco})  ←→  ${c.prof.nome}`)
    console.log(`      servico_id=${c.servico.id}`)
    console.log(`      profissional_id=${c.prof.id}`)
  }
}

if (pular.length > 0) {
  console.log('\n' + linha())
  console.log('JÁ EXISTENTES — nada a fazer (idempotente)')
  console.log(linha())
  for (const p of pular) console.log(`  = ${p.servico.nome} ←→ ${p.prof.nome}`)
}

if (decidir.length > 0) {
  console.log('\n' + '═'.repeat(78))
  console.log('\x1b[33mPARA VOCÊ DECIDIR — não viram vínculo sozinhos\x1b[0m')
  console.log('═'.repeat(78))
  for (const d of decidir) {
    console.log(`  ⚠ ${d.servico.nome}  [${d.negocioNome}]`)
    console.log(`      ${d.motivo}`)
    console.log(`      servico_id=${d.servico.id}`)
  }
  console.log('\n  Estes ficam sem profissional na junção. Depois da Etapa C dá para')
  console.log('  atribuir pela tela; se quiser vincular agora, me diga qual profissional.')
}

// ── DEPOIS ───────────────────────────────────────────────────────────────────

console.log('\n' + '═'.repeat(78))
console.log('DEPOIS — servico_profissional (proposto)')
console.log('═'.repeat(78))
const depois = [
  ...(vinculos ?? []).map(v => ({
    s: servicos.find(x => x.id === v.servico_id)?.nome ?? v.servico_id,
    p: profPorId.get(v.profissional_id)?.nome ?? v.profissional_id,
    novo: false,
  })),
  ...criar.map(c => ({ s: c.servico.nome, p: c.prof.nome, novo: true })),
].sort((a, b) => a.s.localeCompare(b.s) || a.p.localeCompare(b.p))

if (depois.length === 0) console.log('  (continua vazia)')
for (const d of depois) console.log(`  ${d.novo ? '\x1b[32m+\x1b[0m' : ' '} ${d.s} ←→ ${d.p}`)

console.log(`\n  ${jaExiste.size} linha(s) antes  ->  ${depois.length} depois  (+${criar.length})`)
console.log(`  coluna legada servicos.profissional_id: \x1b[32mintacta\x1b[0m, como combinado`)

// ── Gravação ─────────────────────────────────────────────────────────────────

console.log('\n' + '═'.repeat(78))
if (!APPLY) {
  console.log('PREVIEW: nada foi gravado. Para gravar, rode de novo com --apply')
  console.log('═'.repeat(78))
  process.exit(0)
}

if (criar.length === 0) {
  console.log('Nada a criar — já está tudo migrado (idempotente).')
  process.exit(0)
}

const { error } = await db.from('servico_profissional').insert(
  criar.map(c => ({ servico_id: c.servico.id, profissional_id: c.prof.id })),
)
if (error) { console.error('✗ falhou: ' + error.message); process.exit(1) }

const { count } = await db.from('servico_profissional').select('*', { count: 'exact', head: true })
console.log(`✓ ${criar.length} vínculo(s) criado(s). Total na tabela: ${count}`)
console.log('═'.repeat(78))
