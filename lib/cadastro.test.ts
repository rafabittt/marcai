import { test } from 'node:test'
import assert from 'node:assert/strict'
import { decidirCadastro, emailJaCadastrado, ehLinkDuplicado, MSG_SENHA_ERRADA } from './cadastro.ts'

test('e-mail novo: cria o negócio, não é retomada', () => {
  assert.deepEqual(decidirCadastro({ conta: 'criada' }), { acao: 'criar_negocio', retomada: false })
})

test('e-mail existente com senha errada: erro, nada é criado', () => {
  assert.deepEqual(
    decidirCadastro({ conta: 'email_existe', loginOk: false }),
    { acao: 'erro', mensagem: MSG_SENHA_ERRADA },
  )
})

test('e-mail existente, senha certa, conta JÁ tem negócio: vai para o painel', () => {
  assert.deepEqual(
    decidirCadastro({ conta: 'email_existe', loginOk: true, temNegocio: true }),
    { acao: 'ir_painel' },
  )
})

test('e-mail existente, senha certa, conta SEM negócio: retoma o cadastro', () => {
  // É o caso que antes travava em "User already registered".
  assert.deepEqual(
    decidirCadastro({ conta: 'email_existe', loginOk: true, temNegocio: false }),
    { acao: 'criar_negocio', retomada: true },
  )
})

test('login ausente conta como falha: nunca retoma sem a senha conferida', () => {
  const r = decidirCadastro({ conta: 'email_existe' })
  assert.equal(r.acao, 'erro')
})

test('outro erro do Supabase aparece com a mensagem dele', () => {
  assert.deepEqual(
    decidirCadastro({ conta: 'erro', mensagemErro: 'Password should be at least 6 characters' }),
    { acao: 'erro', mensagem: 'Erro ao criar conta: Password should be at least 6 characters' },
  )
})

test('reconhece e-mail repetido por código ou por mensagem', () => {
  assert.equal(emailJaCadastrado({ code: 'user_already_exists' }), true)
  assert.equal(emailJaCadastrado({ message: 'User already registered' }), true)
  assert.equal(emailJaCadastrado({ message: 'Password should be at least 6 characters' }), false)
  assert.equal(emailJaCadastrado(null), false)
})

test('reconhece link duplicado pelo código 23505', () => {
  assert.equal(ehLinkDuplicado({ code: '23505' }), true)
  assert.equal(ehLinkDuplicado({ code: '42501' }), false)
  assert.equal(ehLinkDuplicado(null), false)
})
