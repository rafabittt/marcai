'use client'

import { Clock, Check } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Serviços como cards selecionáveis, com a duração em destaque.
//
// Substitui o <select> de serviço das duas telas de agendamento. Preço ainda
// não aparece: a coluna não existe no schema (ver diagnóstico da Fase 0).
//
// Mantém o fallback de texto livre de antes: negócios sem serviço cadastrado
// continuam podendo digitar o que quiserem.
// ─────────────────────────────────────────────────────────────────────────────

export type Servico = {
  id: string
  nome: string
  duracao: string
  profissional_id?: string
}

type Props = {
  servicos: Servico[]
  valor: string
  onChange: (servicoId: string) => void
  /** Classe do input de texto livre, para casar com o resto do formulário. */
  inputClass: string
}

export default function CardsServico({ servicos, valor, onChange, inputClass }: Props) {
  if (servicos.length === 0) {
    return (
      <input
        type="text"
        value={valor}
        onChange={e => onChange(e.target.value)}
        required
        placeholder="Ex: Corte de cabelo"
        className={inputClass}
      />
    )
  }

  return (
    <div className="grid gap-2.5">
      {servicos.map(s => {
        const selecionado = valor === String(s.id)
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(String(s.id))}
            aria-pressed={selecionado}
            className={[
              'w-full text-left rounded-2xl px-5 py-4 flex items-center gap-4 transition-all duration-150',
              selecionado
                ? 'bg-[#dcfce7] border-2 border-[#25D366]'
                : 'bg-white border-2 border-gray-100 hover:border-gray-200',
            ].join(' ')}
          >
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${selecionado ? 'text-[#0a0a0a]' : 'text-gray-800'}`}>
                {s.nome}
              </p>
              <span className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-gray-500">
                <Clock size={13} />
                {s.duracao}
              </span>
            </div>
            <div
              className={[
                'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                selecionado ? 'bg-[#25D366]' : 'border-2 border-gray-200',
              ].join(' ')}
            >
              {selecionado && <Check size={14} className="text-white" strokeWidth={3} />}
            </div>
          </button>
        )
      })}
    </div>
  )
}
