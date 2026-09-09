'use client'

import { useRef } from 'react'
import { RotateCcw } from 'lucide-react'
import {
  VARIAVEIS, renderizarTemplate, exemploVariaveis,
  type VariaveisMensagem,
} from '@/lib/mensagens'

// ─────────────────────────────────────────────────────────────────────────────
// Editor de um template de mensagem, com inserção de variável no cursor e
// preview ao vivo. Usado duas vezes em /configuracoes: cliente e dono.
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
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <h3 className="text-sm font-semibold text-[#0a0a0a]">{titulo}</h3>
        {!ehPadrao && (
          <button
            type="button"
            onClick={() => onChange(padrao)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          >
            <RotateCcw size={12} />
            Restaurar padrão
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-3">{descricao}</p>

      <textarea
        ref={ref}
        value={valor}
        onChange={e => onChange(e.target.value)}
        rows={4}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#25D366] placeholder-gray-300 resize-y"
      />

      <div className="mt-2.5">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5">
          Inserir variável
        </p>
        <div className="flex flex-wrap gap-1.5">
          {VARIAVEIS.map(v => (
            <button
              key={v.chave}
              type="button"
              onClick={() => inserir(v.chave)}
              title={`Exemplo: ${v.exemplo}`}
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-[#128C7E] bg-[#dcfce7] hover:bg-[#25D366] hover:text-white transition-colors"
            >
              {v.rotulo}
            </button>
          ))}
        </div>
      </div>

      {/* Preview — bolha no espírito do WhatsApp, para o dono ver o resultado. */}
      <div className="mt-4">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5">
          Como vai chegar
        </p>
        <div className="bg-[#dcfce7] rounded-2xl rounded-tl-sm px-4 py-3">
          {preview ? (
            <p className="text-sm text-[#0a0a0a] whitespace-pre-wrap break-words">{preview}</p>
          ) : (
            <p className="text-sm text-gray-400 italic">
              Mensagem vazia — este aviso não será enviado.
            </p>
          )}
        </div>
        {preview.includes('{') && (
          <p className="text-xs text-amber-600 mt-1.5">
            Há uma variável que não existe — confira o nome entre chaves.
          </p>
        )}
      </div>
    </div>
  )
}

export { exemploVariaveis }
