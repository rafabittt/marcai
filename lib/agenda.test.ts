// ─────────────────────────────────────────────────────────────────────────────
// Harness de lib/agenda.ts.
//
// Roda com `npm test` (node:test nativo, sem dependência nova).
//
// O foco é a aritmética de data, que é o risco nº 1 do projeto: a convenção
// "naive UTC" grava os dígitos da hora local dentro de um timestamp Z, então
// ler com getHours() em vez de getUTCHours() desloca tudo em 3h — e o bug só
// aparece para quem olha o horário certo.
//
// Por isso o script de teste roda a suíte em três fusos (UTC, São Paulo e
// Tóquio): qualquer leitura que dependa do fuso da máquina quebra em pelo
// menos um deles.
// ─────────────────────────────────────────────────────────────────────────────

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  minutosParaHHMM, hhmmParaMinutos, gerarGrade, HORARIOS,
  getConfDia, getBuffer, getFolgas, emIntervalo, diaDaSemana,
  horariosDoDia, horariosLivres,
  parseDuracao, parseDuracaoDoServico, slotsOcupadosPor,
  localDateStr, horaDe, dataDe, montarDataHora, naiveNowISO,
  type HorariosMap,
} from './agenda.ts'

// ── Conversão HH:MM ↔ minutos ────────────────────────────────────────────────

test('minutos e HH:MM fazem round-trip', () => {
  for (const hhmm of ['00:00', '08:30', '12:00', '19:45', '23:59']) {
    assert.equal(minutosParaHHMM(hhmmParaMinutos(hhmm)), hhmm)
  }
})

test('minutosParaHHMM preenche com zero à esquerda', () => {
  assert.equal(minutosParaHHMM(0), '00:00')
  assert.equal(minutosParaHHMM(9 * 60 + 5), '09:05')
})

// ── Grade ────────────────────────────────────────────────────────────────────

test('gerarGrade cobre o intervalo fechado, de passo em passo', () => {
  assert.deepEqual(gerarGrade(8 * 60, 9 * 60, 30), ['08:00', '08:30', '09:00'])
})

test('a grade padrão vai de 08:00 a 20:00 de 30 em 30', () => {
  assert.equal(HORARIOS[0], '08:00')
  assert.equal(HORARIOS[HORARIOS.length - 1], '20:00')
  assert.equal(HORARIOS.length, 25)
})

// ── getConfDia ───────────────────────────────────────────────────────────────

const CONF: HorariosMap = {
  domingo: { fechado: true },
  segunda: { abertura: '10:00', fechamento: '16:00' },
  buffer_min: 10,
  folgas: ['2026-09-15'],
}

test('getConfDia indexa pelo dia da semana, com domingo em 0', () => {
  assert.deepEqual(getConfDia(CONF, 0), { fechado: true })
  assert.deepEqual(getConfDia(CONF, 1), { abertura: '10:00', fechamento: '16:00' })
  assert.equal(getConfDia(CONF, 2), null)
})

test('getConfDia ignora as chaves curtas removidas na migração', () => {
  // 'seg' era aceito como fallback; deixou de ser. Se alguém reintroduzir o
  // fallback, este teste quebra.
  assert.equal(getConfDia({ seg: { abertura: '07:00' } } as HorariosMap, 1), null)
})

test('getConfDia não confunde buffer_min e folgas com dia', () => {
  assert.equal(getConfDia({ buffer_min: 10 } as HorariosMap, 3), null)
  assert.equal(getConfDia({ folgas: ['2026-01-01'] } as HorariosMap, 3), null)
})

test('getConfDia devolve null para valor que não é objeto', () => {
  assert.equal(getConfDia({ terca: 'lixo' } as unknown as HorariosMap, 2), null)
  assert.equal(getConfDia({ quarta: null } as unknown as HorariosMap, 3), null)
  assert.equal(getConfDia({ quinta: [] } as unknown as HorariosMap, 4), null)
})

// ── buffer e folgas ──────────────────────────────────────────────────────────

test('getBuffer devolve 0 quando ausente, zero ou negativo', () => {
  assert.equal(getBuffer(CONF), 10)
  assert.equal(getBuffer({}), 0)
  assert.equal(getBuffer({ buffer_min: 0 }), 0)
  assert.equal(getBuffer({ buffer_min: -5 }), 0)
  assert.equal(getBuffer(null), 0)
})

test('getFolgas descarta entradas que não são string', () => {
  assert.deepEqual(getFolgas(CONF), ['2026-09-15'])
  assert.deepEqual(getFolgas({ folgas: ['2026-01-01', 42, null] as unknown as string[] }), ['2026-01-01'])
  assert.deepEqual(getFolgas(null), [])
})

// ── Intervalos ───────────────────────────────────────────────────────────────

test('intervalo é semiaberto: inclui o início, exclui o fim', () => {
  const pausa = [{ inicio: '12:00', fim: '13:00' }]
  assert.equal(emIntervalo('11:30', pausa), false)
  assert.equal(emIntervalo('12:00', pausa), true)
  assert.equal(emIntervalo('12:30', pausa), true)
  assert.equal(emIntervalo('13:00', pausa), false, '13:00 já é atendimento')
})

test('sem intervalos, nada cai em pausa', () => {
  assert.equal(emIntervalo('12:00', []), false)
  assert.equal(emIntervalo('12:00', undefined), false)
})

// ── horariosDoDia ────────────────────────────────────────────────────────────

test('dia fechado e dia inativo não devolvem horário', () => {
  assert.deepEqual(horariosDoDia({ terca: { fechado: true } }, '2026-09-08'), [])
  assert.deepEqual(horariosDoDia({ terca: { ativo: false } }, '2026-09-08'), [])
})

test('folga esvazia o dia mesmo com expediente configurado', () => {
  const h: HorariosMap = {
    terca: { abertura: '08:00', fechamento: '18:00' },
    folgas: ['2026-09-08'],
  }
  assert.deepEqual(horariosDoDia(h, '2026-09-08'), [])
  assert.ok(horariosDoDia(h, '2026-09-15').length > 0, 'outra data segue aberta')
})

test('dia sem configuração cai no fallback 08:00–18:00', () => {
  const r = horariosDoDia({}, '2026-09-08')
  assert.equal(r[0], '08:00')
  assert.equal(r[r.length - 1], '18:00')
})

test('horarios nulo devolve a grade inteira', () => {
  assert.deepEqual(horariosDoDia(null, '2026-09-08'), HORARIOS)
})

test('a pausa é descontada do expediente', () => {
  const r = horariosDoDia({
    terca: { abertura: '08:00', fechamento: '18:00', intervalos: [{ inicio: '12:00', fim: '13:00' }] },
  }, '2026-09-08')
  assert.ok(!r.includes('12:00'))
  assert.ok(!r.includes('12:30'))
  assert.ok(r.includes('11:30'))
  assert.ok(r.includes('13:00'))
})

// ── horariosLivres ───────────────────────────────────────────────────────────

test('horariosLivres remove os ocupados', () => {
  assert.deepEqual(
    horariosLivres(['08:00', '08:30', '09:00'], ['08:30'], '2099-01-01'),
    ['08:00', '09:00'],
  )
})

test('em data futura nada é cortado por hora', () => {
  const grade = ['08:00', '23:30']
  assert.deepEqual(horariosLivres(grade, [], '2099-01-01'), grade)
})

test('hoje, os horários que já passaram somem', () => {
  const hoje = localDateStr()
  // 00:00 só sobrevive se o teste rodar exatamente à meia-noite; usamos um
  // horário garantidamente passado e outro garantidamente futuro.
  const r = horariosLivres(['00:00', '23:59'], [], hoje)
  assert.ok(!r.includes('00:00'), '00:00 já passou')
})

// ── Duração ──────────────────────────────────────────────────────────────────

test('parseDuracao entende min, h e combinação', () => {
  assert.equal(parseDuracao('30 min'), 30)
  assert.equal(parseDuracao('1h'), 60)
  assert.equal(parseDuracao('1h 30min'), 90)
  assert.equal(parseDuracao('2h 30min'), 150)
})

test('parseDuracao cai em 30 quando não reconhece', () => {
  assert.equal(parseDuracao('abacaxi'), 30)
  assert.equal(parseDuracao(''), 30)
})

test('parseDuracaoDoServico usa só os parênteses finais', () => {
  assert.equal(parseDuracaoDoServico('Corte (30 min)'), 30)
  assert.equal(parseDuracaoDoServico('Corte (masculino) (1h)'), 60)
})

test('serviço sem parênteses cai em 30 — o caso que o backfill precisa tratar', () => {
  // Documenta o comportamento atual de propósito: 6 dos 20 agendamentos em
  // produção não têm duração no texto e silenciosamente viram 30 min.
  assert.equal(parseDuracaoDoServico('Corte Masc'), 30)
})

test('slotsOcupadosPor cobre todos os slots da duração', () => {
  assert.deepEqual(slotsOcupadosPor(8 * 60, 30), ['08:00'])
  assert.deepEqual(slotsOcupadosPor(8 * 60, 60), ['08:00', '08:30'])
  assert.deepEqual(slotsOcupadosPor(8 * 60, 90), ['08:00', '08:30', '09:00'])
})

// ── Convenção naive-UTC — o risco nº 1 ───────────────────────────────────────

test('horaDe lê em UTC, então não desloca com o fuso da máquina', () => {
  // Se alguém trocar getUTCHours por getHours, no Brasil isto vira '11:00'.
  assert.equal(horaDe('2026-09-08T14:00:00.000Z'), '14:00')
  assert.equal(horaDe('2026-09-08T00:30:00.000Z'), '00:30')
  assert.equal(horaDe('2026-09-08T23:45:00.000Z'), '23:45')
})

test('montarDataHora e horaDe/dataDe fazem round-trip', () => {
  for (const [d, h] of [['2026-09-08', '14:00'], ['2026-01-01', '00:00'], ['2026-12-31', '23:30']]) {
    const iso = montarDataHora(d, h)
    assert.equal(dataDe(iso), d)
    assert.equal(horaDe(iso), h)
  }
})

test('dataDe não atravessa a virada do dia', () => {
  // Um timestamp de madrugada é onde a leitura por fuso erraria o dia.
  assert.equal(dataDe('2026-09-08T00:00:00.000Z'), '2026-09-08')
  assert.equal(dataDe('2026-09-08T23:59:00.000Z'), '2026-09-08')
})

test('diaDaSemana não desloca por fuso', () => {
  // 2026-09-08 é terça. Parsear a string como ISO (UTC) daria segunda em
  // fusos a oeste — por isso a função monta a data a partir das partes.
  assert.equal(diaDaSemana('2026-09-08'), 2)
  assert.equal(diaDaSemana('2026-09-06'), 0, 'domingo')
  assert.equal(diaDaSemana('2026-09-12'), 6, 'sábado')
})

test('localDateStr devolve a data local, sem passar por UTC', () => {
  assert.equal(localDateStr(new Date(2026, 8, 8, 23, 30)), '2026-09-08')
  assert.equal(localDateStr(new Date(2026, 0, 1, 0, 0)), '2026-01-01')
})

test('naiveNowISO tem o formato que o banco compara', () => {
  assert.match(naiveNowISO(), /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.000Z$/)
})

test('naiveNowISO casa com a hora local, não com a UTC real', () => {
  const agora = new Date()
  assert.equal(dataDe(naiveNowISO()), localDateStr(agora))
  assert.equal(horaDe(naiveNowISO()).slice(0, 2), String(agora.getHours()).padStart(2, '0'))
})
