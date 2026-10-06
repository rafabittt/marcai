'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import Script from 'next/script'
import {
  pixelPermitido, lerConsentimento, CHAVE_CONSENTIMENTO, CHAVE_SEM_PIXEL,
} from '@/lib/pixel'

// ─────────────────────────────────────────────────────────────────────────────
// Meta Pixel + banner de consentimento.
//
// Montado SÓ em "/" e no modo cadastro (aba "Negócio") do /login. Nunca no
// layout: o layout roda em todas as páginas, inclusive na de agendamento do
// cliente final e nas telas logadas, que não podem ser rastreadas.
//
// O script só é inserido depois do "Aceitar". Sem consentimento, nenhum
// cookie da Meta é gravado e nenhuma requisição sai para o Facebook. Por isso
// também não há <noscript> com o pixel de imagem: ele dispararia sem aceite.
//
// Parâmetros de URL:
//   ?sem_pixel=1     marca este navegador para nunca carregar (uso do time)
//   ?rever_cookies=1 apaga a escolha e mostra o banner de novo
// ─────────────────────────────────────────────────────────────────────────────

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

type Estado = 'inativo' | 'perguntar' | 'carregar'

function ler(chave: string): string | null {
  try { return window.localStorage.getItem(chave) } catch { return null }
}

function gravar(chave: string, valor: string | null) {
  try {
    if (valor === null) window.localStorage.removeItem(chave)
    else window.localStorage.setItem(chave, valor)
  } catch { /* navegador sem storage: a escolha só vale nesta visita */ }
}

/** Estado vindo do navegador. Puro: os efeitos colaterais ficam no useEffect. */
function estadoDoNavegador(): Estado {
  const params = new URLSearchParams(window.location.search)
  const semPixel = params.get('sem_pixel') === '1' || ler(CHAVE_SEM_PIXEL) === '1'

  const permitido = pixelPermitido({
    nodeEnv: process.env.NODE_ENV,
    pixelId: PIXEL_ID,
    hostname: window.location.hostname,
    semPixel,
  })
  if (!permitido) return 'inativo'

  const escolha = params.get('rever_cookies') === '1'
    ? null
    : lerConsentimento(ler(CHAVE_CONSENTIMENTO))

  if (escolha === 'aceito') return 'carregar'
  if (escolha === 'recusado') return 'inativo'
  return 'perguntar'
}

const nadaParaAssinar = () => () => {}

export default function MetaPixel() {
  // No servidor e no primeiro render do cliente vale 'inativo'; depois da
  // hidratação lê o navegador. Assim o HTML do servidor nunca tem o pixel.
  const inicial = useSyncExternalStore(nadaParaAssinar, estadoDoNavegador, () => 'inativo' as Estado)
  const [escolhido, setEscolhido] = useState<Estado | null>(null)
  const estado = escolhido ?? inicial

  // Persiste os parâmetros de URL — escrever no localStorage é sincronizar com
  // um sistema externo, que é o uso legítimo de efeito.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('sem_pixel') === '1') gravar(CHAVE_SEM_PIXEL, '1')
    if (params.get('rever_cookies') === '1') gravar(CHAVE_CONSENTIMENTO, null)
  }, [])

  function aceitar() {
    gravar(CHAVE_CONSENTIMENTO, 'aceito')
    setEscolhido('carregar')
  }

  function recusar() {
    gravar(CHAVE_CONSENTIMENTO, 'recusado')
    setEscolhido('inativo')
  }

  if (estado === 'carregar' && PIXEL_ID) {
    return (
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('set','autoConfig',false,'${PIXEL_ID}');
fbq('init','${PIXEL_ID}');
fbq('track','PageView');`}
      </Script>
    )
  }

  if (estado !== 'perguntar') return null

  // Banner: os dois botões têm exatamente o mesmo estilo e tamanho — recusar
  // não pode ser mais difícil nem menos visível que aceitar.
  const botao = 'w-full py-3 rounded-xl text-sm font-semibold text-[#0a0a0a] bg-white border border-gray-300 hover:bg-gray-50 transition-colors'

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6 pointer-events-none">
      <div
        role="dialog"
        aria-label="Aviso sobre cookies"
        className="pointer-events-auto mx-auto max-w-xl bg-white rounded-2xl border border-gray-100 shadow-xl p-5 sm:p-6"
      >
        <p className="text-sm text-gray-700 leading-relaxed">
          Usamos cookies da Meta (Facebook e Instagram) para saber se os nossos anúncios
          funcionam. Eles só são ativados se você aceitar.{' '}
          <a href="/privacidade#cookies" className="text-[#128C7E] underline hover:text-[#25D366]">
            Saiba mais
          </a>
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button type="button" onClick={recusar} className={botao}>Recusar</button>
          <button type="button" onClick={aceitar} className={botao}>Aceitar</button>
        </div>
      </div>
    </div>
  )
}
