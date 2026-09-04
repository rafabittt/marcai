// ─────────────────────────────────────────────────────────────────────────────
// One-off: remove as chaves curtas de dia ('seg'|'ter'|...) do JSONB
// negocios.horarios, deixando só a convenção longa ('segunda'|'terca'|...),
// que é a única que a tela /configuracoes grava.
//
// Regras (nesta ordem, por dia da semana):
//   1. Só a curta existe  -> PROMOVE o valor dela para a chave longa.
//   2. As duas existem    -> mantém a LONGA, descarta a curta.
//   3. Remove todas as chaves curtas ao final.
//   buffer_min, folgas e quaisquer outras chaves são preservados intactos.
//
// A promoção espelha exatamente o que getConfDia JÁ escolhe hoje
// (long ?? short — logo, uma longa `null` cai para a curta), então o
// comportamento por dia é idêntico antes e depois. Antes de gravar, o script
// prova isso em três eixos, nos 7 dias, e aborta se algum falhar:
//   - getConfDia        equivalente (`fechado` e `ativo:false` colapsam)
//   - horariosDoDia     os slots que o cliente vê, idênticos
//   - idempotência      rodar de novo sobre o resultado não muda nada
//
// --normalizar-fechado: os valores das chaves curtas usam `ativo`, que só
// getConfDia entende — a tela /configuracoes lê exclusivamente `fechado`.
// Promover `{ativo:false}` cru mantém o motor correto mas faz a tela mostrar
// o dia como ABERTO. A flag traduz ativo -> fechado nos valores promovidos.
//
// Uso:
//   node --env-file=.env.local scripts/limpar-chaves-curtas.mjs                                # dry-run
//   node --env-file=.env.local scripts/limpar-chaves-curtas.mjs --normalizar-fechado --apply   # grava
//
// EXECUTADO EM PRODUÇÃO em 2026-09-04 com --normalizar-fechado --apply,
// nos 2 negócios existentes. Backup/rollback: scripts/_backups/ (fora do git).
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'
import { getConfDia, getBuffer, getFolgas, horariosDoDia, diaDaSemana, localDateStr } from '../lib/agenda.ts'

const APPLY = process.argv.includes('--apply')
/** Traduz `ativo` (vocabulário morto) para `fechado`, que é o que a UI lê. */
const NORMALIZAR = process.argv.includes('--normalizar-fechado')

const CHAVE_LONGA = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']
const CHAVE_CURTA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']
const ROTULO = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Use --env-file=.env.local')
  process.exit(1)
}
const db = createClient(url, key, { auth: { persistSession: false } })

// ── Helpers ──────────────────────────────────────────────────────────────────

/** JSON canônico (chaves ordenadas) para comparar valores por igualdade profunda. */
function canon(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v) ?? 'undefined'
  if (Array.isArray(v)) return `[${v.map(canon).join(',')}]`
  return `{${Object.keys(v).sort().map(k => `${JSON.stringify(k)}:${canon(v[k])}`).join(',')}}`
}

function ehObjeto(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Descreve um HorarioDia em uma linha, para o relatório. */
function resumo(conf) {
  if (conf === null || conf === undefined) return 'sem definição (fallback 08:00–18:00)'
  if (!ehObjeto(conf)) return `valor inválido (${JSON.stringify(conf)}) -> tratado como sem definição`
  if (conf.fechado || conf.ativo === false) return 'FECHADO'
  const ab = conf.abertura ?? '—'
  const fe = conf.fechamento ?? '—'
  const extras = []
  if (conf.aberto24h) extras.push('24h')
  if (conf.intervalos?.length) {
    extras.push(`pausas: ${conf.intervalos.map(i => `${i.inicio}-${i.fim}`).join(', ')}`)
  }
  return `aberto ${ab}–${fe}${extras.length ? ` (${extras.join('; ')})` : ''}`
}

/**
 * `ativo` é vocabulário morto: só getConfDia o entende (`fechado || ativo === false`).
 * A tela /configuracoes lê exclusivamente `fechado`. Ao promover um dia que só
 * existia na chave curta, traduzir para `fechado` mantém o comportamento e evita
 * que a UI passe a mostrar o dia como aberto.
 */
function normalizarDia(v) {
  if (!ehObjeto(v)) return v
  if (!Object.prototype.hasOwnProperty.call(v, 'ativo')) return v
  const { ativo, ...resto } = v
  return { ...resto, fechado: resto.fechado ?? (ativo === false) }
}

/** O que a tela /configuracoes mostra para um dia (ela lê SÓ `fechado`). */
const HORARIOS_PADRAO_UI = {
  segunda: { abertura: '08:00', fechamento: '18:00', fechado: false },
  terca:   { abertura: '08:00', fechamento: '18:00', fechado: false },
  quarta:  { abertura: '08:00', fechamento: '18:00', fechado: false },
  quinta:  { abertura: '08:00', fechamento: '18:00', fechado: false },
  sexta:   { abertura: '08:00', fechamento: '18:00', fechado: false },
  sabado:  { abertura: '08:00', fechamento: '18:00', fechado: true },
  domingo: { abertura: '08:00', fechamento: '18:00', fechado: true },
}
function renderUI(horarios, dow) {
  const key = CHAVE_LONGA[dow]
  const dia = (horarios ?? {})[key] ?? HORARIOS_PADRAO_UI[key]
  if (!ehObjeto(dia)) return 'valor inválido'
  if (dia.fechado) return 'Fechado'
  if (dia.aberto24h) return 'Aberto 24h'
  return `Aberto ${dia.abertura}–${dia.fechamento}`
}

/**
 * Aplica as regras de limpeza. Não muta a entrada.
 * Retorna { limpo, acoes[], mudou }.
 */
function limpar(horarios) {
  const limpo = structuredClone(horarios ?? {})
  const acoes = []

  for (let dow = 0; dow < 7; dow++) {
    const kL = CHAVE_LONGA[dow]
    const kC = CHAVE_CURTA[dow]
    const temL = Object.prototype.hasOwnProperty.call(limpo, kL)
    const temC = Object.prototype.hasOwnProperty.call(limpo, kC)
    const vL = limpo[kL]
    const vC = limpo[kC]

    // getConfDia usa `long ?? short`: uma longa null/undefined cai para a curta.
    // A promoção precisa seguir a MESMA regra, senão o dia muda de comportamento.
    const longaEfetiva = temL && vL !== null && vL !== undefined

    if (!temC) {
      acoes.push({ dow, acao: temL ? 'nada (só longa)' : 'nada (nenhuma chave)' })
      continue
    }
    if (longaEfetiva) {
      const iguais = canon(vL) === canon(vC)
      acoes.push({
        dow,
        acao: iguais
          ? `remove curta '${kC}' (idêntica à longa)`
          : `remove curta '${kC}' (DIVERGE da longa — longa vence)`,
        divergia: !iguais,
        curtaDescartada: vC,
      })
      delete limpo[kC]
    } else {
      limpo[kL] = NORMALIZAR ? normalizarDia(vC) : vC
      delete limpo[kC]
      acoes.push({
        dow,
        acao: temL
          ? `PROMOVE '${kC}' -> '${kL}' (longa existia como ${JSON.stringify(vL)}, que getConfDia ignora)`
          : `PROMOVE '${kC}' -> '${kL}'`,
        promovido: true,
      })
    }
  }

  return { limpo, acoes, mudou: canon(limpo) !== canon(horarios ?? {}) }
}

/**
 * Forma semântica de um dia: só o que os consumidores realmente usam.
 * `fechado` e `ativo:false` colapsam no mesmo booleano, porque getConfDia
 * trata os dois como fechado (`conf.fechado || conf.ativo === false`).
 */
function semantica(conf) {
  if (!ehObjeto(conf)) return conf === null || conf === undefined ? 'null' : 'invalido'
  const fechado = !!(conf.fechado || conf.ativo === false)
  if (fechado) return 'fechado'
  return canon({
    abertura: conf.abertura,
    fechamento: conf.fechamento,
    aberto24h: !!conf.aberto24h,
    intervalos: conf.intervalos ?? [],
  })
}

/** Compara getConfDia nos 7 dias, usando a função REAL de lib/agenda.ts. */
function compararConfDia(antes, depois) {
  const linhas = []
  for (let dow = 0; dow < 7; dow++) {
    const a = getConfDia(antes ?? {}, dow)
    const d = getConfDia(depois ?? {}, dow)
    linhas.push({
      dow, a, d,
      igual: canon(a) === canon(d),
      equiv: semantica(a) === semantica(d),
    })
  }
  return linhas
}

/** Uma data real para cada dia da semana, a partir de hoje. */
function datasDaSemana() {
  const out = new Array(7)
  const base = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i)
    out[diaDaSemana(localDateStr(d))] = localDateStr(d)
  }
  return out
}
const DATAS = datasDaSemana()

/** Compara a saída REAL de horariosDoDia (os slots que o cliente vê). */
function compararSlots(antes, depois) {
  return DATAS.map((data, dow) => {
    const a = horariosDoDia(antes, data)
    const d = horariosDoDia(depois, data)
    return { dow, data, a, d, igual: canon(a) === canon(d) }
  })
}

function faixa(slots) {
  if (!slots.length) return 'nenhum slot (fechado)'
  return `${slots.length} slots ${slots[0]}–${slots[slots.length - 1]}`
}

// ── Execução ─────────────────────────────────────────────────────────────────

const { data: negocios, error } = await db
  .from('negocios')
  .select('id, nome, slug, horarios')
  .order('nome')

if (error) { console.error('Erro na query:', error.message); process.exit(1) }

console.log(`\nMODO: ${APPLY ? '\x1b[31mAPPLY (grava no banco)\x1b[0m' : '\x1b[32mDRY-RUN (não grava nada)\x1b[0m'}`)
console.log(`Negócios encontrados: ${negocios.length}\n`)

const plano = []

for (const neg of negocios) {
  const orig = neg.horarios
  const { limpo, acoes, mudou } = limpar(orig)
  const cmp = compararConfDia(orig, limpo)
  const slots = compararSlots(orig, limpo)
  // Idempotência: rodar de novo sobre o resultado não pode mudar nada.
  const idem = !limpar(limpo).mudou
  const ok = cmp.every(l => l.equiv) && slots.every(l => l.igual) && idem

  console.log('═'.repeat(78))
  console.log(`NEGÓCIO: ${neg.nome}  [slug: ${neg.slug}]`)
  console.log(`id: ${neg.id}`)
  console.log('═'.repeat(78))

  // ── Backup: JSONB original completo ──
  console.log('\n── JSONB ORIGINAL (backup reversível) ──')
  console.log(JSON.stringify(orig, null, 2))

  // ── Inventário de chaves ──
  const chaves = Object.keys(orig ?? {})
  const curtas = chaves.filter(k => CHAVE_CURTA.includes(k))
  const longas = chaves.filter(k => CHAVE_LONGA.includes(k))
  const outras = chaves.filter(k => !CHAVE_CURTA.includes(k) && !CHAVE_LONGA.includes(k))
  console.log(`\n── Chaves ──`)
  console.log(`  longas  (${longas.length}): ${longas.join(', ') || '—'}`)
  console.log(`  curtas  (${curtas.length}): ${curtas.join(', ') || '—'}`)
  console.log(`  outras  (${outras.length}): ${outras.join(', ') || '—'}`)
  const suspeitas = outras.filter(k => !['buffer_min', 'folgas'].includes(k))
  if (suspeitas.length) console.log(`  \x1b[33m⚠ chaves não reconhecidas (preservadas intactas): ${suspeitas.join(', ')}\x1b[0m`)

  // ── Relatório ANTES/DEPOIS por dia ──
  console.log('\n── ANTES / DEPOIS por dia da semana ──')
  for (let dow = 0; dow < 7; dow++) {
    const kL = CHAVE_LONGA[dow], kC = CHAVE_CURTA[dow]
    const o = orig ?? {}
    const antesL = Object.prototype.hasOwnProperty.call(o, kL) ? JSON.stringify(o[kL]) : '—'
    const antesC = Object.prototype.hasOwnProperty.call(o, kC) ? JSON.stringify(o[kC]) : '—'
    const depoisL = Object.prototype.hasOwnProperty.call(limpo, kL) ? JSON.stringify(limpo[kL]) : '—'
    const acao = acoes.find(a => a.dow === dow)
    const marca = acao?.promovido ? '\x1b[36m↑\x1b[0m' : acao?.divergia ? '\x1b[33m≠\x1b[0m' : ' '

    console.log(`\n  ${marca} ${ROTULO[dow]}`)
    console.log(`      antes  ${kL.padEnd(8)}= ${antesL}`)
    console.log(`      antes  ${kC.padEnd(8)}= ${antesC}`)
    console.log(`      depois ${kL.padEnd(8)}= ${depoisL}`)
    console.log(`      depois ${kC.padEnd(8)}= — (removida)`)
    console.log(`      ação: ${acao?.acao}`)
    if (acao?.divergia) {
      console.log(`      \x1b[33mcurta descartada: ${JSON.stringify(acao.curtaDescartada)}\x1b[0m`)
    }
  }

  // ── Verificação getConfDia ──
  console.log('\n── getConfDia: ANTES vs DEPOIS (7 dias) ──')
  for (const l of cmp) {
    const sinal = l.igual ? '\x1b[32m✓\x1b[0m' : l.equiv ? '\x1b[36m≈\x1b[0m' : '\x1b[31m✗\x1b[0m'
    const nota = !l.igual && l.equiv ? '  (ativo:false -> fechado:true, mesmo significado)' : ''
    console.log(`  ${sinal} ${ROTULO[l.dow].padEnd(8)} antes: ${resumo(l.a).padEnd(46)} depois: ${resumo(l.d)}${nota}`)
  }
  const nIgual = cmp.filter(l => l.igual).length
  const nEquiv = cmp.filter(l => l.equiv).length
  console.log(`\n  RESULTADO: ${nEquiv}/7 equivalentes (${nIgual}/7 idênticos byte a byte) ${nEquiv === 7 ? '\x1b[32mOK\x1b[0m' : '\x1b[31mDIVERGÊNCIA — não gravar\x1b[0m'}`)

  // ── Verificação comportamental: slots que o cliente realmente vê ──
  console.log('\n── horariosDoDia: ANTES vs DEPOIS (slots reais, 7 dias) ──')
  for (const l of slots) {
    const sinal = l.igual ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'
    console.log(`  ${sinal} ${ROTULO[l.dow].padEnd(8)} ${l.data}  antes: ${faixa(l.a).padEnd(26)} depois: ${faixa(l.d)}`)
  }
  const nSlots = slots.filter(l => l.igual).length
  console.log(`\n  RESULTADO: ${nSlots}/7 ${nSlots === 7 ? '\x1b[32midênticos\x1b[0m' : '\x1b[31mDIVERGÊNCIA — não gravar\x1b[0m'}`)

  // ── O que a tela /configuracoes mostra (ela lê SÓ `fechado`, nunca `ativo`) ──
  console.log('\n── Tela /configuracoes: ANTES vs DEPOIS ──')
  let uiDiff = 0
  for (let dow = 0; dow < 7; dow++) {
    const a = renderUI(orig, dow)
    const d = renderUI(limpo, dow)
    const igual = a === d
    if (!igual) uiDiff++
    const sinal = igual ? '\x1b[32m✓\x1b[0m' : '\x1b[33m⚠\x1b[0m'
    console.log(`  ${sinal} ${ROTULO[dow].padEnd(8)} antes: ${a.padEnd(22)} depois: ${d}`)
  }
  if (uiDiff) {
    console.log(`\n  \x1b[33m⚠ ${uiDiff} dia(s) mudam de aparência na tela /configuracoes.\x1b[0m`)
    console.log(`  \x1b[33m  Causa: o valor promovido usa \`ativo\`, que a UI não lê — só \`fechado\`.\x1b[0m`)
    console.log(`  \x1b[33m  Rode com --normalizar-fechado para traduzir ativo -> fechado na promoção.\x1b[0m`)
  } else {
    console.log(`\n  \x1b[32m✓ nenhum dia muda de aparência na tela.\x1b[0m`)
  }

  console.log(`\n── Idempotência ──`)
  console.log(`  rodar o script de novo sobre o resultado: ${idem ? '\x1b[32mnão muda nada ✓\x1b[0m' : '\x1b[31mMUDARIA ✗\x1b[0m'}`)

  // ── Outras chaves preservadas ──
  console.log(`\n── Preservados ──`)
  console.log(`  buffer_min: ${JSON.stringify(orig?.buffer_min)} -> ${JSON.stringify(limpo.buffer_min)}  (getBuffer: ${getBuffer(orig)} -> ${getBuffer(limpo)})`)
  console.log(`  folgas:     ${JSON.stringify(getFolgas(orig))} -> ${JSON.stringify(getFolgas(limpo))}`)

  console.log(`\n── JSONB DEPOIS (proposto) ──`)
  console.log(JSON.stringify(limpo, null, 2))
  console.log(`\n  mudou? ${mudou ? 'SIM' : 'não — já está limpo (idempotente)'}\n`)

  plano.push({ neg, limpo, mudou, ok })
}

// ── Gravação ─────────────────────────────────────────────────────────────────

console.log('═'.repeat(78))
if (!APPLY) {
  console.log('DRY-RUN: nada foi gravado. Para gravar, rode de novo com --apply')
  console.log('═'.repeat(78))
  process.exit(0)
}

const bloqueados = plano.filter(p => !p.ok)
if (bloqueados.length) {
  console.error(`ABORTADO: ${bloqueados.length} negócio(s) com divergência no getConfDia.`)
  process.exit(1)
}

for (const p of plano) {
  if (!p.mudou) { console.log(`= ${p.neg.nome}: já limpo, nada a fazer (idempotente)`) ; continue }
  const { error: upErr } = await db
    .from('negocios')
    .update({ horarios: p.limpo })
    .eq('id', p.neg.id)
  if (upErr) { console.error(`✗ ${p.neg.nome}: ${upErr.message}`); process.exit(1) }
  console.log(`✓ ${p.neg.nome}: gravado`)
}
console.log('Concluído.')
console.log('═'.repeat(78))
