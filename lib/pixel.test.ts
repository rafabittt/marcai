import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pixelPermitido, lerConsentimento } from './pixel.ts'

const OK = { nodeEnv: 'production', pixelId: '966059303202885', hostname: 'marcai.net.br', semPixel: false }

test('produção, ID, domínio certo e sem opt-out: permitido', () => {
  assert.equal(pixelPermitido(OK), true)
  assert.equal(pixelPermitido({ ...OK, hostname: 'www.marcai.net.br' }), true)
  assert.equal(pixelPermitido({ ...OK, hostname: 'MARCAI.NET.BR' }), true)
})

test('dev e teste nunca carregam, mesmo com o ID no .env.local', () => {
  assert.equal(pixelPermitido({ ...OK, nodeEnv: 'development' }), false)
  assert.equal(pixelPermitido({ ...OK, nodeEnv: 'test' }), false)
  assert.equal(pixelPermitido({ ...OK, nodeEnv: undefined }), false)
})

test('preview da Vercel e build local de produção não carregam — a trava é o domínio', () => {
  // Os dois rodam com NODE_ENV=production; só o hostname os separa da produção.
  assert.equal(pixelPermitido({ ...OK, hostname: 'marcai-git-main-rafabittt.vercel.app' }), false)
  assert.equal(pixelPermitido({ ...OK, hostname: 'localhost' }), false)
  assert.equal(pixelPermitido({ ...OK, hostname: '127.0.0.1' }), false)
  assert.equal(pixelPermitido({ ...OK, hostname: 'marcai.net.br.evil.com' }), false)
})

test('sem ID, ou ID que não é número, não carrega', () => {
  assert.equal(pixelPermitido({ ...OK, pixelId: undefined }), false)
  assert.equal(pixelPermitido({ ...OK, pixelId: '' }), false)
  assert.equal(pixelPermitido({ ...OK, pixelId: 'abc' }), false)
})

test('navegador marcado como sem pixel nunca carrega', () => {
  assert.equal(pixelPermitido({ ...OK, semPixel: true }), false)
})

test('consentimento: só aceito/recusado valem; o resto é "não escolheu"', () => {
  assert.equal(lerConsentimento('aceito'), 'aceito')
  assert.equal(lerConsentimento('recusado'), 'recusado')
  assert.equal(lerConsentimento(null), null)
  assert.equal(lerConsentimento('sim'), null)
  assert.equal(lerConsentimento(''), null)
})
