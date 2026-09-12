import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  rotuloData, somarDias, gerarBuckets, agruparAgendamentos, variacao, intervaloTicks,
} from './grafico.ts'

test('rotuloData usa formato fixo, sem depender do ICU', () => {
  assert.equal(rotuloData('2026-09-12'), '12 set')
  assert.equal(rotuloData('2026-01-01'), '1 jan')
  assert.equal(rotuloData('2026-12-31'), '31 dez')
})

test('somarDias atravessa mês e ano sem deslocar', () => {
  assert.equal(somarDias('2026-09-12', 1), '2026-09-13')
  assert.equal(somarDias('2026-09-30', 1), '2026-10-01')
  assert.equal(somarDias('2026-12-31', 1), '2027-01-01')
  assert.equal(somarDias('2026-01-01', -1), '2025-12-31')
  assert.equal(somarDias('2026-03-01', -1), '2026-02-28')
})

test('somarDias atravessa 29 de fevereiro em ano bissexto', () => {
  assert.equal(somarDias('2028-02-28', 1), '2028-02-29')
  assert.equal(somarDias('2028-02-29', 1), '2028-03-01')
})

test('buckets por dia cobrem o período inteiro, inclusive as pontas', () => {
  const b = gerarBuckets('2026-09-12', 7, 'dia')
  assert.equal(b.length, 7)
  assert.equal(b[0].chave, '2026-09-06')
  assert.equal(b[6].chave, '2026-09-12')
  assert.ok(b.every(x => x.chave === x.fim), 'no agrupamento por dia, início e fim coincidem')
})

test('o eixo é contínuo: dia sem agendamento também vira bucket', () => {
  const buckets = gerarBuckets('2026-09-12', 30, 'dia')
  assert.equal(buckets.length, 30)
  const pontos = agruparAgendamentos(
    [{ data_hora: '2026-09-12T10:00:00.000Z', status: 'confirmado' }],
    buckets,
  )
  assert.equal(pontos.length, 30, 'nada é omitido por estar zerado')
  assert.equal(pontos.filter(p => p.total === 0).length, 29)
})

test('buckets por semana têm 7 dias e o último é recortado no fim', () => {
  const b = gerarBuckets('2026-09-12', 90, 'semana')
  assert.equal(b[0].chave, '2026-06-15')
  assert.equal(b[0].fim, '2026-06-21')
  assert.equal(b[b.length - 1].fim, '2026-09-12', 'a última semana não passa do fim')
  assert.ok(b.every(x => x.fim <= '2026-09-12'))
})

test('agrupar separa realizados de cancelados', () => {
  const buckets = gerarBuckets('2026-09-12', 3, 'dia')
  const pontos = agruparAgendamentos([
    { data_hora: '2026-09-11T10:00:00.000Z', status: 'confirmado' },
    { data_hora: '2026-09-11T14:00:00.000Z', status: 'cancelado' },
    { data_hora: '2026-09-12T09:00:00.000Z', status: 'confirmado' },
  ], buckets)
  assert.deepEqual(
    pontos.map(p => [p.chave, p.Realizados, p.Cancelados]),
    [['2026-09-10', 0, 0], ['2026-09-11', 1, 1], ['2026-09-12', 1, 0]],
  )
})

test('agendamento fora do período é ignorado', () => {
  const buckets = gerarBuckets('2026-09-12', 3, 'dia')
  const pontos = agruparAgendamentos(
    [{ data_hora: '2026-01-01T10:00:00.000Z', status: 'confirmado' }],
    buckets,
  )
  assert.equal(pontos.reduce((s, p) => s + p.total, 0), 0)
})

test('a hora não muda o dia do bucket — nem à meia-noite, nem perto dela', () => {
  // O risco naive-UTC: parsear a string como Date jogaria 00:30 para o dia
  // anterior em fusos a oeste.
  const buckets = gerarBuckets('2026-09-12', 3, 'dia')
  for (const hora of ['00:00', '00:30', '12:00', '23:59']) {
    const pontos = agruparAgendamentos(
      [{ data_hora: `2026-09-11T${hora}:00.000Z`, status: 'confirmado' }],
      buckets,
    )
    const p = pontos.find(x => x.chave === '2026-09-11')!
    assert.equal(p.total, 1, `${hora} deveria cair em 11/09`)
  }
})

test('agrupamento por semana soma os dias dentro da semana', () => {
  const buckets = gerarBuckets('2026-09-12', 14, 'semana')
  const pontos = agruparAgendamentos([
    { data_hora: '2026-08-30T10:00:00.000Z', status: 'confirmado' },
    { data_hora: '2026-09-01T10:00:00.000Z', status: 'confirmado' },
    { data_hora: '2026-09-10T10:00:00.000Z', status: 'cancelado' },
  ], buckets)
  assert.equal(pontos.length, 2)
  assert.equal(pontos[0].Realizados, 2, 'os dois primeiros caem na semana 1')
  assert.equal(pontos[1].Cancelados, 1)
})

test('variação compara com o período anterior', () => {
  assert.equal(variacao(12, 10), 20)
  assert.equal(variacao(8, 10), -20)
  assert.equal(variacao(10, 10), 0)
})

test('variação sem base anterior: 0 vs 0 é zero, algo vs 0 é incomparável', () => {
  assert.equal(variacao(0, 0), 0)
  assert.equal(variacao(5, 0), null, 'crescer a partir de zero não tem percentual')
})

test('intervaloTicks rareia os rótulos quando há bucket demais', () => {
  assert.equal(intervaloTicks(7), 0, '7 buckets cabem sem pular')
  assert.equal(intervaloTicks(30) > 0, true)
  assert.ok(Math.ceil(30 / (intervaloTicks(30) + 1)) <= 7)
  assert.ok(Math.ceil(90 / (intervaloTicks(90) + 1)) <= 7)
})
