'use client'

import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'

// Casca das telas do dono: barra lateral flutuante à esquerda e o conteúdo.
// No celular a barra vira uma gaveta e aparece uma barra de cima de vidro
// (vidro só no que flutua).
export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="flex min-h-dvh">
      {/* Fundo escurecido da gaveta (celular) */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={`scrim z-30 md:hidden transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Barra lateral: fixa no computador, gaveta no celular */}
      <div
        className={`fixed inset-y-0 left-0 z-40 transition-transform duration-[280ms] ease-grafite md:sticky md:top-0 md:h-dvh md:translate-x-0 md:z-auto shrink-0 ${
          open ? 'translate-x-0' : '-translate-x-[110%]'
        }`}
      >
        <Sidebar onNavigate={() => setOpen(false)} />
      </div>

      <div className="flex-1 min-w-0">
        {/* Barra de cima no celular */}
        <div className="glass sticky top-0 z-20 flex items-center gap-2 px-3 h-14 border-b border-hairline md:hidden">
          <button
            onClick={() => setOpen(true)}
            className="btn btn-ghost btn-icon"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
          <img src="/logo.png" alt="Marcaí" style={{ height: 20 }} />
        </div>

        {children}
      </div>
    </div>
  )
}
