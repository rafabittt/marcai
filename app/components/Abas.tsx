'use client'

import { useLayoutEffect, useRef, useState } from 'react'

// Abas em pílula do Grafite: trilho branco com borda fina; a ativa é preta
// (branca no escuro) e desliza até a nova posição.

export default function Abas<T extends string | number>({
  opcoes, valor, onChange, rotulo, pequeno = false,
}: {
  opcoes: readonly (readonly [T, string])[]
  valor: T
  onChange: (v: T) => void
  /** Nome do grupo para leitor de tela. */
  rotulo: string
  pequeno?: boolean
}) {
  const trilho = useRef<HTMLDivElement>(null)
  const [thumb, setThumb] = useState<{ x: number; w: number } | null>(null)

  useLayoutEffect(() => {
    const el = trilho.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')
    if (!el) return
    const medir = () => setThumb({ x: el.offsetLeft, w: el.offsetWidth })
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [valor])

  return (
    <div ref={trilho} className="tabs" role="group" aria-label={rotulo}>
      {thumb && (
        <span
          aria-hidden
          className="tabs-thumb"
          style={{ width: thumb.w, transform: `translateX(${thumb.x}px)` }}
        />
      )}
      {opcoes.map(([id, label]) => (
        <button
          key={String(id)}
          type="button"
          aria-pressed={valor === id}
          onClick={() => onChange(id)}
          className={`tab ${pequeno ? '!px-2.5 !py-1 !text-[12px]' : ''}`}
          // Antes da primeira medida a pílula ainda não existe: pinta a ativa direto.
          style={!thumb && valor === id ? { background: 'var(--ink)' } : undefined}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
