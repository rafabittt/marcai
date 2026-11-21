'use client'

import { useRef } from 'react'
import { RotateCcw, Plus } from 'lucide-react'
import {
  VARIAVEIS, renderizarTemplate, exemploVariaveis,
  type VariaveisMensagem,
} from '@/lib/mensagens'

// ─────────────────────────────────────────────────────────────────────────────
// Editor de um template de mensagem, com inserção de variável no cursor e
// preview ao vivo. Usado duas vezes em /configuracoes: cliente e dono.
//
// Grafite: campo .field, variáveis em pílulas neutras (são controles, não
// dados) e o preview numa bolha suave na cor da marca, no espírito do
// WhatsApp — é a única informação colorida do editor.
// ─────────────────────────────────────────────────────────────────────────────

export default function EditorMensagem({
  titulo, descricao, valor, onChange, padrao, exemplo,
}: {
  titulo: string
  descricao: string
  valor: string
  onChange: (v: string) => void
  padrao: string
  /** Valores usados no preview. */
  exemplo: VariaveisMensagem
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  /** Insere no ponto do cursor, e não no fim — o dono costuma editar no meio. */
  function inserir(chave: string) {
    const el = ref.current
    const token = `{${chave}}`
    if (!el) { onChange(valor + token); return }
    const ini = el.selectionStart ?? valor.length
    const fim = el.selectionEnd ?? valor.length
    onChange(valor.slice(0, ini) + token + valor.slice(fim))
    // Recoloca o cursor depois do que foi inserido, para o dono seguir digitando.
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(ini + token.length, ini + token.length)
    })
  }

  const preview = renderizarTemplate(valor, exemplo)
  const ehPadrao = valor.trim() === padrao.trim()

  return (
    <div>
      <div className="flex items-center justify-between gap-3 min-h-8">
        <h3 className="t-section">{titulo}</h3>
        {!ehPadrao && (
          <button
            type="button"
            onClick={() => onChange(padrao)}
            className="btn btn-ghost btn-sm -mr-2 shrink-0"
          >
            <RotateCcw size={14} strokeWidth={1.8} />
            Restaurar padrão
          </button>
        )}
      </div>
      <p className="t-cap mb-3">{descricao}</p>

      <textarea
        ref={ref}
        value={valor}
        onChange={e => onChange(e.target.value)}
        rows={4}
        aria-label={titulo}
        className="field resize-y"
      />

      <div className="mt-3">
        <p className="field-label">Inserir variável</p>
        <div className="flex flex-wrap gap-1.5">
          {VARIAVEIS.map(v => (
            <button
              key={v.chave}
              type="button"
              onClick={() => inserir(v.chave)}
              title={`Exemplo: ${v.exemplo}`}
              className="btn btn-sm font-medium text-muted hover:text-fg"
            >
              <Plus size={13} strokeWidth={1.8} aria-hidden />
              {v.rotulo}
            </button>
          ))}
        </div>
      </div>

      {/* Preview — bolha no espírito do WhatsApp, para o dono ver o resultado. */}
      <div className="mt-4">
        <p className="field-label">Como vai chegar</p>
        <div className="bg-accent-soft rounded-card rounded-tl-tag px-4 py-3">
          {preview ? (
            <p className="text-[14px] text-fg whitespace-pre-wrap break-words">{preview}</p>
          ) : (
            <p className="text-[14px] text-muted italic">
              Mensagem vazia — este aviso não será enviado.
            </p>
          )}
        </div>
        {preview.includes('{') && (
          <p className="t-cap text-bad-ink mt-1.5">
            Há uma variável que não existe — confira o nome entre chaves.
          </p>
        )}
      </div>
    </div>
  )
}

export { exemploVariaveis }
