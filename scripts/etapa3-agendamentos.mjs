// ─────────────────────────────────────────────────────────────────────────────
// FASE 1, ETAPA 3 — limpeza dos agendamentos de teste e backfill de
// duracao_min e profissional_id.
//
// Decisões do Rafa:
//   - Os órfãos de teste são APAGADOS, com backup antes. A lista é fixa por id
//     (não recalculada), para nada entrar na exclusão sem ter sido aprovado.
//   - "ellen" (Saúde 30+) saiu da exclusão: telefone e negócio não batem com
//     dado de teste, pode ser cliente real.
//   - preco dos passados fica NULL (Opção 1). Este script não toca em preco.
//
// Uso:
//   node --env-file=.env.local scripts/etapa3-agendamentos.mjs                     # preview, não grava
//   node --env-file=.env.local scripts/etapa3-agendamentos.mjs --apagar-teste      # backup + apaga os 5
//   node --env-file=.env.local scripts/etapa3-agendamentos.mjs --gravar-backfill   # grava duracao_min/profissional_id
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import { parseDuracaoDoServico } from '../lib/agenda.ts'

const APAGAR  = process.argv.includes('--apagar-teste')
const GRAVAR  = process.argv.includes('--gravar-backfill')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.error('Use --env-file=.env.local'); process.exit(1) }
const db = createClient(url, key, { auth: { persistSession: false } })

// Aprovados para exclusão — fixos por id.
const PARA_APAGAR = [
  '54eccd37-6b45-432d-b001-eafdaa7b2c77', // Jaja       — telefone do dono do "Teste"
  '92691525-24f1-46ae-bf61-b5102b72027d', // Huhu       — idem
  'c9fafcf6-8d11-4d14-84e6-6a0653c4128c', // Hdhd       — idem
  '1503f85a-ff17-4c42-9667-c21825c43614', // Hehe       — idem
  'eb4ce8e6-e9e0-49e0-80e1-6244e2dc69b0', // Teste User — (11) 99999-9999
]

const TEM_DURACAO = /\(([^)]+)\)\s*$/
const dia = (a) => a.data_hora.slice(0, 10)
const hora = (a) => a.data_hora.slice(11, 16)
const pad = (s, n) => String(s ?? '—').slice(0, n).padEnd(n)
const bar = (t) => { console.log('\n' + '═'.repeat(100)); console.log(t); console.log('═'.repeat(100)) }

const [{ data: ags }, { data: profs }, { data: negs }] = await Promise.all([
  db.from('agendamentos').select('*').order('data_hora'),
  db.from('profissionais').select('id, nome, negocio_id'),
  db.from('negocios').select('id, slug'),
])
const slug = (id) => negs.find(n => n.id === id)?.slug ?? '?'

// ── 1. Exclusão ──────────────────────────────────────────────────────────────
const apagar = ags.filter(a => PARA_APAGAR.includes(a.id))
const faltando = PARA_APAGAR.filter(id => !ags.some(a => a.id === id))

bar(`1. EXCLUSÃO — ${apagar.length} agendamentos de teste`)
console.log(`  ${pad('id', 38)}${pad('cliente', 12)}${pad('data', 18)}${pad('serviço', 40)}status`)
for (const a of apagar) {
  console.log(`  ${pad(a.id, 38)}${pad(a.cliente_nome, 12)}${pad(dia(a) + ' ' + hora(a), 18)}${pad(a.servico, 40)}${a.status}`)
}
if (faltando.length) console.log(`  (já não existem: ${faltando.join(', ')})`)

bar('   FORA DA EXCLUSÃO — pode ser cliente real, decidir à parte')
for (const a of ags.filter(a => a.id === 'c0f0543a-8ea0-40e2-acce-54548dfd5e29')) {
  console.log(`  ${pad(a.id, 38)}${pad(a.cliente_nome, 12)}${pad(dia(a) + ' ' + hora(a), 18)}${pad(a.servico, 40)}${a.status}`)
  console.log(`  negócio: ${slug(a.negocio_id)} · telefone não é do dono · sem duração no texto · sem profissional`)
}

// ── 2. Backfill ──────────────────────────────────────────────────────────────
const restantes = ags.filter(a => !PARA_APAGAR.includes(a.id))
const plano = restantes.map(a => {
  const duracao = TEM_DURACAO.test(a.servico ?? '') ? parseDuracaoDoServico(a.servico) : null
  const prof = a.profissional
    ? profs.find(p => p.nome === a.profissional && p.negocio_id === a.negocio_id)
    : null
  return {
    a,
    novaDuracao: a.duracao_min ?? duracao,
    novoProf: a.profissional_id ?? prof?.id ?? null,
    profNome: prof?.nome ?? null,
    pendencia: [
      duracao === null && a.duracao_min === null ? 'sem duração no texto' : null,
      a.profissional && !prof ? `nome "${a.profissional}" não casa com profissional` : null,
      !a.profissional ? 'sem profissional' : null,
    ].filter(Boolean),
  }
})

bar(`2. BACKFILL — ${restantes.length} agendamentos (antes → depois). preco não é tocado: fica NULL.`)
console.log(`  ${pad('cliente', 14)}${pad('data', 18)}${pad('serviço', 22)}${pad('status', 12)}${pad('duracao_min', 18)}profissional_id`)
console.log('  ' + '─'.repeat(98))
for (const p of plano) {
  const a = p.a
  const d = `${a.duracao_min ?? 'null'} → ${p.novaDuracao ?? 'null'}`
  const pr = `${a.profissional_id ? a.profissional_id.slice(0, 8) : 'null'} → ${p.novoProf ? p.novoProf.slice(0, 8) + ` (${p.profNome})` : 'null'}`
  console.log(`  ${pad(a.cliente_nome, 14)}${pad(dia(a) + ' ' + hora(a), 18)}${pad(a.servico, 22)}${pad(a.status, 12)}${pad(d, 18)}${pr}${p.pendencia.length ? '   ⚠ ' + p.pendencia.join('; ') : ''}`)
}

const mudancas = plano.filter(p => p.novaDuracao !== p.a.duracao_min || p.novoProf !== p.a.profissional_id)
const pendentes = plano.filter(p => p.pendencia.length)
console.log(`\n  ${mudancas.length} linha(s) mudam · ${pendentes.length} com pendência (ficam null nesse campo, sem chute)`)

// ── Gravação ─────────────────────────────────────────────────────────────────
if (APAGAR) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  const arq = `scripts/_backups/agendamentos-teste-${ts}.json`
  fs.writeFileSync(arq, JSON.stringify(apagar, null, 2))
  const relido = JSON.parse(fs.readFileSync(arq, 'utf8'))
  if (relido.length !== apagar.length) { console.error('Backup não confere — abortado.'); process.exit(1) }
  const { error } = await db.from('agendamentos').delete().in('id', PARA_APAGAR)
  if (error) { console.error('✗ ' + error.message); process.exit(1) }
  console.log(`\n✓ ${apagar.length} apagados. Backup: ${arq}`)
} else if (GRAVAR) {
  for (const p of mudancas) {
    const { error } = await db.from('agendamentos')
      .update({ duracao_min: p.novaDuracao, profissional_id: p.novoProf })
      .eq('id', p.a.id)
    if (error) { console.error(`✗ ${p.a.id}: ${error.message}`); process.exit(1) }
  }
  console.log(`\n✓ ${mudancas.length} agendamento(s) atualizados.`)
} else {
  console.log('\nPREVIEW — nada foi gravado nem apagado.')
}
