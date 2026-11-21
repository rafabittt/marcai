'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Lightbulb, Check } from 'lucide-react'

export default function FeedbackModal({ onClose }: { onClose: () => void }) {
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 text-fg">
      <div className="scrim" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Enviar sugestão" className="sheet relative w-full max-w-md p-6 sm:p-7">
        <button onClick={onClose} aria-label="Fechar" className="btn btn-ghost btn-icon btn-sm absolute top-4 right-4">
          <X size={18} />
        </button>

        {enviado ? (
          <div className="empty !py-4">
            <div className="tile-ico mb-2 !bg-accent-soft !text-accent-ink"><Check size={18} /></div>
            <h2 className="t-section">Obrigado pela sugestão!</h2>
            <p className="t-cap mb-4">Vamos analisar sua ideia com cuidado.</p>
            <button onClick={onClose} className="btn btn-primary btn-block">Fechar</button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-5 pr-8">
              <div className="tile-ico"><Lightbulb size={18} strokeWidth={1.8} /></div>
              <div>
                <h2 className="t-section">Enviar sugestão</h2>
                <p className="t-cap">Uma ideia, melhoria ou feedback sobre o Marcaí</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                value={texto}
                onChange={e => setTexto(e.target.value.slice(0, 500))}
                placeholder="Ex: Seria útil poder exportar os agendamentos como planilha..."
                rows={5}
                required
                aria-label="Sua sugestão"
                className="field resize-none"
              />
              <p className="t-cap text-right tabular">{texto.length}/500</p>

              <button type="submit" disabled={enviando || !texto.trim()} className="btn btn-primary btn-block btn-lg">
                {enviando ? 'Enviando…' : 'Enviar sugestão'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
