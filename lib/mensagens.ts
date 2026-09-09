// ─────────────────────────────────────────────────────────────────────────────
// Templates das mensagens de confirmação no WhatsApp.
//
// São dois: um para o cliente e um para o dono (a notificação que ele recebe).
// Ficam em negocios.horarios, o mesmo JSONB que já guarda buffer_min e folgas —
// o nome da coluna é histórico, ela é a configuração do negócio. Chaves novas,
// sem migração de tabela.
//
// Os defaults reproduzem LETRA POR LETRA o que o app já envia hoje, para que
// ligar esta feature não mude nenhuma mensagem até o dono editar.
//
// Nada disto toca no Z-API: o texto renderizado aqui é exatamente o que segue
// para o send-text, igual a antes.
// ─────────────────────────────────────────────────────────────────────────────

export const CHAVE_MSG_CLIENTE = 'msg_confirmacao_cliente'
export const CHAVE_MSG_DONO    = 'msg_confirmacao_dono'

export type VariaveisMensagem = {
  cliente?: string | null
  telefone?: string | null
  servico?: string | null
  profissional?: string | null
  data?: string | null
  hora?: string | null
  endereco?: string | null
  negocio?: string | null
}

/** Ordem em que aparecem na tela, com exemplo para o preview. */
export const VARIAVEIS: { chave: keyof VariaveisMensagem; rotulo: string; exemplo: string }[] = [
  { chave: 'cliente',      rotulo: 'Cliente',      exemplo: 'Maria Souza' },
  { chave: 'telefone',     rotulo: 'Telefone',     exemplo: '(11) 98765-4321' },
  { chave: 'servico',      rotulo: 'Serviço',      exemplo: 'Corte Masc (30 min)' },
  { chave: 'profissional', rotulo: 'Profissional', exemplo: 'Bri' },
  { chave: 'data',         rotulo: 'Data',         exemplo: '09/09/2026' },
  { chave: 'hora',         rotulo: 'Hora',         exemplo: '14:00' },
  { chave: 'endereco',     rotulo: 'Endereço',     exemplo: 'Rua das Flores, 120 — Centro' },
  { chave: 'negocio',      rotulo: 'Negócio',      exemplo: 'Barbearia do Zé' },
]

// Os colchetes marcam trecho opcional: some inteiro quando as variáveis dentro
// dele estão vazias. É o que reproduz o comportamento atual do código, onde
// `com {profissional}` só entra quando há profissional.
export const MSG_CLIENTE_PADRAO =
  'Olá {cliente}! Seu agendamento em {negocio} foi confirmado para {data} às {hora}[ com {profissional}]. Até lá!'

export const MSG_DONO_PADRAO =
  'Novo agendamento! {cliente} agendou {servico}[ com {profissional}] para {data} às {hora}. Tel: {telefone}'

/** Um trecho entre colchetes, sem aninhamento. */
const SEGMENTO_OPCIONAL = /\[([^[\]]*)\]/g
const VARIAVEL = /\{(\w+)\}/g

const NOMES_VALIDOS = new Set<string>(VARIAVEIS.map(v => v.chave))

/**
 * Valor de uma variável, ou undefined se o nome não existe.
 *
 * "Existe" é decidido pela lista VARIAVEIS, e NÃO pela presença no objeto
 * recebido: um chamador que esqueça de passar `profissional` tem que produzir
 * texto limpo, não um {profissional} literal indo para o WhatsApp do cliente.
 * Literal fica reservado para nome que realmente não existe — um erro de
 * digitação do dono, que precisa aparecer no preview.
 */
function valorDe(vars: VariaveisMensagem, nome: string): string | undefined {
  if (!NOMES_VALIDOS.has(nome)) return undefined
  const v = vars[nome as keyof VariaveisMensagem]
  return v === null || v === undefined ? '' : String(v).trim()
}

/**
 * Substitui as variáveis e limpa o resultado.
 *
 * Regras, nesta ordem:
 *  1. Trecho entre colchetes some inteiro se TODAS as variáveis dentro dele
 *     estiverem vazias. Se ao menos uma tiver valor, os colchetes somem e o
 *     conteúdo fica. Colchetes sem variável nenhuma são só texto.
 *  2. Variável conhecida sem valor vira string vazia.
 *  3. Variável DESCONHECIDA fica literal — um {profissinal} com erro de
 *     digitação precisa aparecer no preview, não sumir em silêncio.
 *  4. Sobra de espaço é limpa: espaços repetidos viram um, espaço antes de
 *     pontuação sai, e três ou mais quebras de linha viram duas.
 */
export function renderizarTemplate(template: string, vars: VariaveisMensagem): string {
  const semOpcionais = template.replace(SEGMENTO_OPCIONAL, (_todo, conteudo: string) => {
    const nomes = [...String(conteudo).matchAll(VARIAVEL)].map(m => m[1])
    const conhecidas = nomes.filter(n => valorDe(vars, n) !== undefined)
    // Sem variável conhecida dentro, o colchete é texto comum do dono.
    if (conhecidas.length === 0) return conteudo
    const algumaComValor = conhecidas.some(n => valorDe(vars, n) !== '')
    return algumaComValor ? conteudo : ''
  })

  const substituido = semOpcionais.replace(VARIAVEL, (todo, nome: string) => {
    const v = valorDe(vars, nome)
    return v === undefined ? todo : v
  })

  return substituido
    .replace(/[^\S\n]{2,}/g, ' ')       // espaços repetidos (sem tocar em \n)
    .replace(/[^\S\n]+([,.;:!?])/g, '$1') // espaço antes de pontuação
    .replace(/\n{3,}/g, '\n\n')
    .split('\n').map(l => l.trimEnd()).join('\n')
    .trim()
}

type ConfigComMensagens = { [chave: string]: unknown } | null | undefined

function lerTemplate(config: ConfigComMensagens, chave: string, padrao: string): string {
  const v = config?.[chave]
  return typeof v === 'string' && v.trim() !== '' ? v : padrao
}

/** Template do cliente, com o default quando não configurado. */
export function getTemplateCliente(config: ConfigComMensagens): string {
  return lerTemplate(config, CHAVE_MSG_CLIENTE, MSG_CLIENTE_PADRAO)
}

/** Template do dono, com o default quando não configurado. */
export function getTemplateDono(config: ConfigComMensagens): string {
  return lerTemplate(config, CHAVE_MSG_DONO, MSG_DONO_PADRAO)
}

/** Valores de exemplo, para o preview ao vivo da tela de configurações. */
export function exemploVariaveis(negocioNome?: string | null): VariaveisMensagem {
  const ex = Object.fromEntries(VARIAVEIS.map(v => [v.chave, v.exemplo])) as VariaveisMensagem
  return { ...ex, negocio: negocioNome?.trim() || ex.negocio }
}
