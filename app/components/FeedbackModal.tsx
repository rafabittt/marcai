'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Lightbulb } from 'lucide-react'

export default function FeedbackModal({ onClose }: { onClose: () => void }) {
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim()) return
    setEnviando(true)
    try {
      await fetch('/api/sugestao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: texto.trim() }),
      })
      setEnviado(true)
    } catch {
      // silently fail — user feedback shouldn't block anything
    } finally {
      setEnviando(false)
    }
  }

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-8 z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={18} />
        </button>

        {enviado ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-[#dcfce7] flex items-center justify-center mx-auto mb-4">
              <Lightbulb size={24} className="text-[#25D366]" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Obrigado pela sugestão!</h2>
            <p className="text-sm text-gray-500 mb-6">Vamos analisar sua ideia com cuidado.</p>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-[#25D366] hover:bg-[#128C7E] transition-colors"
            >
              Fechar
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#dcfce7] flex items-center justify-center shrink-0">
                <Lightbulb size={18} className="text-[#25D366]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 leading-tight">Enviar sugestão</h2>
                <p className="text-xs text-gray-500">Uma ideia, melhoria ou feedback sobre o Marcaí</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={texto}
                onChange={e => setTexto(e.target.value.slice(0, 500))}
                placeholder="Ex: Seria útil poder exportar os agendamentos como planilha..."
                rows={5}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-[#25D366] placeholder-gray-300"
              />
              <p className="text-xs text-gray-400 text-right -mt-2">{texto.length}/500</p>

              <button
                type="submit"
                disabled={enviando || !texto.trim()}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-[#25D366] hover:bg-[#128C7E] transition-colors disabled:opacity-50"
              >
                {enviando ? 'Enviando...' : 'Enviar sugestão'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
