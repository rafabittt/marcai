// ─────────────────────────────────────────────────────────────────────────────
// Decisão do cadastro do dono quando o Supabase responde à criação da conta.
//
// O bug que isto fecha: a conta era criada ANTES de o negócio ser gravado. Se o
// negócio falhasse, a conta ficava órfã e a pessoa, ao tentar de novo, caía em
// "User already registered" — sem caminho para terminar o cadastro.
//
// Agora, quando o e-mail já existe, a tela tenta entrar com a senha digitada:
//   - senha errada        → erro (a conta é de outra pessoa ou ela esqueceu);
//   - conta com negócio   → já é cliente: vai para o painel;
//   - conta sem negócio   → é uma tentativa anterior que falhou: retoma.
//
// Retomar exige a senha certa, então ninguém assume a conta de outra pessoa.
// ─────────────────────────────────────────────────────────────────────────────

export type ResultadoConta = 'criada' | 'email_existe' | 'erro'

export type ProximoPasso =
  | { acao: 'criar_negocio'; retomada: boolean }
  | { acao: 'ir_painel' }
  | { acao: 'erro'; mensagem: string }

export const MSG_SENHA_ERRADA =
  'Este e-mail já tem conta. Entre pela aba "Entrar" ou recupere a senha.'

/** O Supabase sinaliza e-mail repetido por código (versões novas) ou mensagem. */
export function emailJaCadastrado(erro: { code?: string; message?: string } | null | undefined): boolean {
  if (!erro) return false
  return erro.code === 'user_already_exists'
    || /already registered/i.test(erro.message ?? '')
}

export function decidirCadastro(c: {
  conta: ResultadoConta
  /** Mensagem do Supabase, para erros que não são e-mail repetido. */
  mensagemErro?: string
  /** Só para conta === 'email_existe': o login com a senha digitada funcionou? */
  loginOk?: boolean
  /** Só para conta === 'email_existe' e loginOk: essa conta já tem negócio? */
  temNegocio?: boolean
}): ProximoPasso {
  if (c.conta === 'criada') return { acao: 'criar_negocio', retomada: false }

  if (c.conta === 'erro') {
    return { acao: 'erro', mensagem: 'Erro ao criar conta: ' + (c.mensagemErro || 'tente novamente.') }
  }

  // e-mail já existe
  if (!c.loginOk) return { acao: 'erro', mensagem: MSG_SENHA_ERRADA }
  if (c.temNegocio) return { acao: 'ir_painel' }
  return { acao: 'criar_negocio', retomada: true }
}

/** Violação de unicidade no Postgres — o link foi pego entre a checagem e o insert. */
export function ehLinkDuplicado(erro: { code?: string } | null | undefined): boolean {
  return erro?.code === '23505'
}
