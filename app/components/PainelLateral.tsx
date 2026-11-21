'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Painel que desliza pela lateral (janela por cima do Grafite).
//
// No celular sobe de baixo e ocupa a largura toda; no computador entra pela
// direita, solto das bordas como a barra lateral. Fecha no Esc, no X e no
// clique do fundo escurecido.
// ─────────────────────────────────────────────────────────────────────────────

export default function PainelLateral({
  aberto, onFechar, titulo, children, rodape,
}: {
  aberto: boolean
  onFechar: () => void
  titulo: React.ReactNode
  children: React.ReactNode
  rodape?: React.ReactNode
}) {
  useEffect(() => {
    if (!aberto) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onFechar() }
    window.addEventListener('keydown', onKey)
    // Trava o scroll do fundo enquanto o painel está aberto.
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [aberto, onFechar])

  return (
    <>
      <div
        onClick={onFechar}
        aria-hidden
        className={`scrim z-40 transition-opacity duration-200 ${
          aberto ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-hidden={!aberto}
        inert={!aberto}
        className={`sheet fixed z-50 flex flex-col transition-transform duration-[280ms] ease-grafite
          inset-x-0 bottom-0 max-h-[88dvh] rounded-b-none
          sm:inset-y-3 sm:left-auto sm:right-3 sm:w-[26rem] sm:max-h-none sm:rounded-b-[22px]
          ${aberto ? 'translate-y-0 sm:translate-x-0' : 'translate-y-full sm:translate-y-0 sm:translate-x-[calc(100%+24px)]'}`}
      >
        <header className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 flex-shrink-0">
          <div className="min-w-0">{titulo}</div>
          <button onClick={onFechar} aria-label="Fechar" className="btn btn-ghost btn-icon btn-sm -mr-2 -mt-1">
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 pb-6">{children}</div>

        {rodape && (
          <footer className="px-6 py-5 border-t border-hairline flex-shrink-0">{rodape}</footer>
        )}
      </aside>
    </>
  )
}
