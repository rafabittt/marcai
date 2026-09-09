import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  renderizarTemplate, getTemplateCliente, getTemplateDono,
  MSG_CLIENTE_PADRAO, MSG_DONO_PADRAO, exemploVariaveis,
} from './mensagens.ts'

const CHEIO = {
  cliente: 'Maria Souza', telefone: '(11) 98765-4321',
  servico: 'Corte Masc (30 min)', profissional: 'Bri',
  data: '09/09/2026', hora: '14:00',
  endereco: 'Rua das Flores, 120', negocio: 'Barbearia do Zé',
}

// ── Os defaults têm que reproduzir o texto atual, letra por letra ────────────

test('default do cliente reproduz o texto que o app já envia hoje', () => {
  assert.equal(
    renderizarTemplate(MSG_CLIENTE_PADRAO, CHEIO),
    'Olá Maria Souza! Seu agendamento em Barbearia do Zé foi confirmado para 09/09/2026 às 14:00 com Bri. Até lá!',
  )
})

test('default do dono reproduz o texto que o app já envia hoje', () => {
  assert.equal(
    renderizarTemplate(MSG_DONO_PADRAO, CHEIO),
    'Novo agendamento! Maria Souza agendou Corte Masc (30 min) com Bri para 09/09/2026 às 14:00. Tel: (11) 98765-4321',
  )
})

test('sem profissional, o default degrada igual ao código atual', () => {
  // Hoje: profTexto = profissionalNome ? ' com X' : ''
  assert.equal(
    renderizarTemplate(MSG_CLIENTE_PADRAO, { ...CHEIO, profissional: null }),
    'Olá Maria Souza! Seu agendamento em Barbearia do Zé foi confirmado para 09/09/2026 às 14:00. Até lá!',
  )
  assert.equal(
    renderizarTemplate(MSG_DONO_PADRAO, { ...CHEIO, profissional: '' }),
    'Novo agendamento! Maria Souza agendou Corte Masc (30 min) para 09/09/2026 às 14:00. Tel: (11) 98765-4321',
  )
})

// ── Trecho opcional ─────────────────────────────────────────────────────────

test('colchete some quando todas as variáveis dentro estão vazias', () => {
  assert.equal(renderizarTemplate('Oi[ com {profissional}]!', { profissional: null }), 'Oi!')
  assert.equal(renderizarTemplate('Oi[ com {profissional}]!', { profissional: 'Bri' }), 'Oi com Bri!')
})

test('colchete fica quando ao menos uma variável tem valor', () => {
  assert.equal(
    renderizarTemplate('[{profissional} em {endereco}]', { profissional: '', endereco: 'Centro' }),
    'em Centro',
  )
})

test('colchete sem variável nenhuma é texto comum', () => {
  assert.equal(renderizarTemplate('Chegue [10 min] antes', {}), 'Chegue 10 min antes')
})

// ── Variável sem valor e variável desconhecida ──────────────────────────────

test('variável conhecida sem valor some, sem quebrar a frase', () => {
  assert.equal(renderizarTemplate('Olá {cliente}, tudo bem?', { cliente: null }), 'Olá, tudo bem?')
  assert.equal(renderizarTemplate('Serviço: {servico}.', { servico: '' }), 'Serviço:.')
})

test('variável válida omitida pelo chamador rende vazio, não literal', () => {
  // Regressão: antes o "conhecida" era decidido pela presença no objeto, então
  // um chamador que esquecesse a chave mandava {profissional} cru no WhatsApp.
  assert.equal(renderizarTemplate('Oi {cliente}[ com {profissional}]!', { cliente: 'Ana' }), 'Oi Ana!')
  assert.equal(renderizarTemplate('Serviço {servico}', {}), 'Serviço')
})

test('variável desconhecida fica literal, para o erro aparecer no preview', () => {
  assert.equal(
    renderizarTemplate('Olá {profissinal}!', { profissional: 'Bri' }),
    'Olá {profissinal}!',
  )
})

// ── Limpeza ─────────────────────────────────────────────────────────────────

test('espaços repetidos viram um só', () => {
  assert.equal(renderizarTemplate('a {x}  {y} b', { cliente: null }), 'a {x} {y} b')
  assert.equal(renderizarTemplate('Olá {cliente} tudo bem', { cliente: null }), 'Olá tudo bem')
})

test('quebras de linha são preservadas, e blocos vazios colapsam', () => {
  const t = 'Linha 1\n{cliente}\n\n\nLinha 2'
  assert.equal(renderizarTemplate(t, { cliente: null }), 'Linha 1\n\nLinha 2')
})

test('template multilinha com variáveis preenchidas mantém o formato', () => {
  const t = 'Olá {cliente}!\n\nData: {data}\nHora: {hora}'
  assert.equal(
    renderizarTemplate(t, CHEIO),
    'Olá Maria Souza!\n\nData: 09/09/2026\nHora: 14:00',
  )
})

test('resultado vem trimado', () => {
  assert.equal(renderizarTemplate('  {cliente}  ', { cliente: 'Ana' }), 'Ana')
})

// ── Leitura da config ───────────────────────────────────────────────────────

test('config sem as chaves cai no default', () => {
  assert.equal(getTemplateCliente(null), MSG_CLIENTE_PADRAO)
  assert.equal(getTemplateCliente({}), MSG_CLIENTE_PADRAO)
  assert.equal(getTemplateDono(undefined), MSG_DONO_PADRAO)
})

test('template em branco ou não-string cai no default', () => {
  assert.equal(getTemplateCliente({ msg_confirmacao_cliente: '   ' }), MSG_CLIENTE_PADRAO)
  assert.equal(getTemplateCliente({ msg_confirmacao_cliente: 42 }), MSG_CLIENTE_PADRAO)
})

test('template configurado vence o default', () => {
  assert.equal(getTemplateCliente({ msg_confirmacao_cliente: 'Oi {cliente}' }), 'Oi {cliente}')
  assert.equal(getTemplateDono({ msg_confirmacao_dono: 'Novo: {cliente}' }), 'Novo: {cliente}')
})

test('a config de horários convive: chaves de dia não viram template', () => {
  const config = { segunda: { abertura: '08:00' }, buffer_min: 10, msg_confirmacao_dono: 'X' }
  assert.equal(getTemplateDono(config), 'X')
  assert.equal(getTemplateCliente(config), MSG_CLIENTE_PADRAO)
})

test('exemploVariaveis usa o nome real do negócio quando existe', () => {
  assert.equal(exemploVariaveis('Barbearia X').negocio, 'Barbearia X')
  assert.equal(exemploVariaveis(null).negocio, 'Barbearia do Zé')
  assert.equal(exemploVariaveis('  ').negocio, 'Barbearia do Zé')
})

test('preview com os exemplos não deixa chave crua sobrando', () => {
  for (const t of [MSG_CLIENTE_PADRAO, MSG_DONO_PADRAO]) {
    const r = renderizarTemplate(t, exemploVariaveis('Teste'))
    assert.ok(!r.includes('{'), 'sobrou variável em: ' + r)
    assert.ok(!r.includes('['), 'sobrou colchete em: ' + r)
  }
})
