import { test } from 'node:test'
import assert from 'node:assert/strict'
import { destinoSeguro } from './destino.ts'

test('aceita caminho interno, com e sem query', () => {
  assert.equal(destinoSeguro('/dashboard', '/x'), '/dashboard')
  assert.equal(destinoSeguro('/assinar?plano=pro', '/x'), '/assinar?plano=pro')
  assert.equal(destinoSeguro('/agendar/barbearia-do-zeca', '/x'), '/agendar/barbearia-do-zeca')
})

test('vazio volta para o padrão', () => {
  assert.equal(destinoSeguro(null, '/dashboard'), '/dashboard')
  assert.equal(destinoSeguro(undefined, '/dashboard'), '/dashboard')
  assert.equal(destinoSeguro('', '/dashboard'), '/dashboard')
})

test('recusa mandar para outro site', () => {
  for (const ruim of [
    'https://site-falso.com',
    'http://site-falso.com/login',
    '//site-falso.com',
    '/\\site-falso.com',
    '/\t/site-falso.com',
    'javascript:alert(1)',
    '@site-falso.com',
    'site-falso.com',
  ]) {
    assert.equal(destinoSeguro(ruim, '/dashboard'), '/dashboard', ruim)
  }
})
