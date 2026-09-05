'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Painel que desliza pela lateral. Substitui o modal centralizado do dashboard.
//
// No mobile ocupa a largura toda e desliza de baixo; no desktop entra pela
// direita. Fecha no Esc e no clique do backdrop.
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
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          aberto ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-hidden={!aberto}
        className={`fixed z-50 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out
          inset-x-0 bottom-0 max-h-[88vh] rounded-t-3xl
          sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[26rem] sm:max-h-none sm:rounded-t-none
          ${aberto ? 'translate-y-0 sm:translate-x-0' : 'translate-y-full sm:translate-y-0 sm:translate-x-full'}`}
      >
        <header className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 flex-shrink-0">
          <div className="min-w-0">{titulo}</div>
          <button
            onClick={onFechar}
            aria-label="Fechar"
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100 flex-shrink-0"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 pb-6">{children}</div>

        {rodape && (
          <footer className="px-6 py-5 border-t border-gray-100 flex-shrink-0">{rodape}</footer>
        )}
      </aside>
    </>
  )
}
