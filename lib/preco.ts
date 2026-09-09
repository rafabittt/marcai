// ─────────────────────────────────────────────────────────────────────────────
// Preço em reais: leitura do que o dono digita e formatação para exibir.
//
// O banco guarda numeric(10,2) — nunca float, que acumula erro de centavo.
// Aqui o valor trafega como `number` de reais (80.5 = R$ 80,50).
//
// `null` é um estado legítimo e distinto de zero: serviço sem preço cadastrado
// não é serviço de graça. Quem consome precisa tratar os dois casos.
// ─────────────────────────────────────────────────────────────────────────────

/** Teto de numeric(10,2): 8 dígitos inteiros + 2 decimais. */
export const PRECO_MAX = 99_999_999.99

/**
 * Interpreta o que foi digitado. Aceita as formas que um brasileiro usa:
 * '80', '80,50', '80.50', '1.234,56', 'R$ 80,00'.
 *
 * Devolve null para vazio (sem preço) e para entrada que não vira número.
 */
export function parsePreco(texto: string): number | null {
  // O sinal precisa ser visto ANTES da limpeza: a limpeza remove o '-' e
  // '-10' viraria 10, aceitando um preço negativo em silêncio.
  if (texto.includes('-')) return null

  const limpo = texto.replace(/[^\d.,]/g, '')
  if (limpo === '') return null

  const temVirgula = limpo.includes(',')
  const temPonto   = limpo.includes('.')

  let normalizado: string
  if (temVirgula && temPonto) {
    // '1.234,56' — ponto é milhar, vírgula é decimal.
    normalizado = limpo.replace(/\./g, '').replace(',', '.')
  } else if (temVirgula) {
    // '80,50'
    normalizado = limpo.replace(',', '.')
  } else {
    // '80' ou '80.50' — ponto tratado como decimal, que é o que quem digita
    // no teclado numérico espera.
    normalizado = limpo
  }

  const n = Number(normalizado)
  if (!Number.isFinite(n) || n < 0 || n > PRECO_MAX) return null
  // Centavos: o banco só guarda duas casas.
  return Math.round(n * 100) / 100
}

/** 'R$ 80,50'. Devolve string vazia para null. */
export function formatarPreco(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return ''
  return valor.toLocaleString('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })
}

/** '80,50' — para preencher um input de edição, sem o símbolo. */
export function precoParaInput(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return ''
  return valor.toFixed(2).replace('.', ',')
}
