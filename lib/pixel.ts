// ─────────────────────────────────────────────────────────────────────────────
// Regras de quando o Meta Pixel pode carregar.
//
// O Pixel só existe em "/" e no modo cadastro (aba "Negócio") do /login — o
// cliente final do nosso cliente nunca é rastreado. Além disso, TODAS as
// travas abaixo precisam passar, e só então o banner pede consentimento:
//
//   1. build de produção (NODE_ENV);
//   2. ID configurado (NEXT_PUBLIC_META_PIXEL_ID);
//   3. domínio de produção — é o que barra preview da Vercel e localhost, que
//      também rodam com NODE_ENV=production;
//   4. o navegador não foi marcado como "sem pixel" (o próprio time).
//
// Sem nenhuma delas, nem o banner aparece: não faz sentido pedir aceite para
// algo que não vai carregar.
// ─────────────────────────────────────────────────────────────────────────────

export const HOSTS_PERMITIDOS = ['marcai.net.br', 'www.marcai.net.br']

/** localStorage: escolha do banner. */
export const CHAVE_CONSENTIMENTO = 'marcai_consentimento_pixel'
/** localStorage: navegador do time, excluído para sempre. Ligado por ?sem_pixel=1. */
export const CHAVE_SEM_PIXEL = 'marcai_sem_pixel'

export type Consentimento = 'aceito' | 'recusado'

export function pixelPermitido(c: {
  nodeEnv: string | undefined
  pixelId: string | undefined
  hostname: string
  semPixel: boolean
}): boolean {
  return c.nodeEnv === 'production'
    && typeof c.pixelId === 'string'
    && /^\d+$/.test(c.pixelId.trim())
    && HOSTS_PERMITIDOS.includes(c.hostname.toLowerCase())
    && !c.semPixel
}

/** Lê a escolha guardada; qualquer valor desconhecido conta como "ainda não escolheu". */
export function lerConsentimento(valor: string | null | undefined): Consentimento | null {
  return valor === 'aceito' || valor === 'recusado' ? valor : null
}

declare global {
  interface Window { fbq?: (...args: unknown[]) => void }
}

/**
 * Evento de cadastro concluído. Sem NENHUM parâmetro: nada de e-mail, telefone
 * ou CPF vai para a Meta.
 *
 * Só faz algo se o Pixel estiver carregado — o que já implica produção, domínio
 * certo e consentimento dado. Caso contrário retorna na hora.
 *
 * Espera um instante antes de devolver porque quem chama redireciona em
 * seguida, e a navegação imediata pode cancelar a requisição do evento.
 */
export async function rastrearCadastroConcluido(): Promise<void> {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return
  window.fbq('track', 'CompleteRegistration')
  await new Promise(r => setTimeout(r, 300))
}
