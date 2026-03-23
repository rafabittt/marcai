'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Sidebar from './Sidebar'

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-screen" style={{ background: '#f9f9f9' }}>

      {/* Sidebar — fixo no desktop, off-canvas no mobile */}
      <>
        {/* Overlay mobile */}
        {open && (
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setOpen(false)}
          />
        )}

        {/* Painel */}
        <div
          className={`fixed inset-y-0 left-0 z-40 transition-transform duration-300 md:static md:translate-x-0 md:z-auto ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar onNavigate={() => setOpen(false)} />
        </div>
      </>

      {/* Conteúdo principal */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Topbar mobile */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 md:hidden">
          <button
            onClick={() => setOpen(true)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
          <img src="/logo.png" alt="Marcaí" style={{ height: 22 }} />
        </div>

        {children}
      </main>
    </div>
  )
}
