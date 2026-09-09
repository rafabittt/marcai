import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parsePreco, formatarPreco, precoParaInput, PRECO_MAX } from './preco.ts'

test('vazio é null, não zero — serviço sem preço não é de graça', () => {
  assert.equal(parsePreco(''), null)
  assert.equal(parsePreco('   '), null)
  assert.equal(parsePreco('R$'), null)
  assert.equal(parsePreco('abc'), null)
})

test('zero explícito é zero, e não se confunde com vazio', () => {
  assert.equal(parsePreco('0'), 0)
  assert.equal(parsePreco('0,00'), 0)
})

test('aceita as formas que um brasileiro digita', () => {
  assert.equal(parsePreco('80'), 80)
  assert.equal(parsePreco('80,50'), 80.5)
  assert.equal(parsePreco('80.50'), 80.5)
  assert.equal(parsePreco('R$ 80,00'), 80)
  assert.equal(parsePreco('1.234,56'), 1234.56)
})

test('arredonda para centavos, que é o que o banco guarda', () => {
  assert.equal(parsePreco('80,999'), 81)
  assert.equal(parsePreco('80,554'), 80.55)
})

test('recusa negativo e acima do teto de numeric(10,2)', () => {
  assert.equal(parsePreco('-10'), null)
  assert.equal(parsePreco(String(PRECO_MAX + 1)), null)
  assert.equal(parsePreco(String(PRECO_MAX)), PRECO_MAX)
})

test('formatarPreco devolve moeda BR e vazio para null', () => {
  //   é o espaço não separável que o Intl usa depois de R$.
  assert.equal(formatarPreco(80.5).replace(/ /g, ' '), 'R$ 80,50')
  assert.equal(formatarPreco(0).replace(/ /g, ' '), 'R$ 0,00')
  assert.equal(formatarPreco(null), '')
  assert.equal(formatarPreco(undefined), '')
})

test('precoParaInput volta sem símbolo, com vírgula', () => {
  assert.equal(precoParaInput(80.5), '80,50')
  assert.equal(precoParaInput(80), '80,00')
  assert.equal(precoParaInput(null), '')
})

test('input e parse fazem round-trip', () => {
  for (const v of [0, 1, 80, 80.5, 1234.56, 99.99]) {
    assert.equal(parsePreco(precoParaInput(v)), v)
  }
})
