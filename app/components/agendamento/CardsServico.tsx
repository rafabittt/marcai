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
  preco?: number | null
  /** Ids dos profissionais que executam este serviço, vindos da junção. */
  profissionais_ids?: string[]
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

  // Visual Grafite: cada serviço é um cartão pequeno clicável. O escolhido
  // fica preto (como a aba ativa), com o check à direita: o estado não
  // depende só da cor.
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
              'card card-sm card-link w-full text-left !px-4 !py-3.5 min-h-[60px] flex items-center gap-3',
              selecionado ? 'bg-ink text-ink-text border-transparent' : '',
            ].join(' ')}
          >
            <div className="flex-1 min-w-0">
              <p className={`text-[15px] font-semibold truncate ${selecionado ? 'text-ink-text' : 'text-fg'}`}>
                {s.nome}
              </p>
              <span className={`t-cap mt-0.5 inline-flex items-center gap-1.5 ${selecionado ? 'text-ink-text/70' : ''}`}>
                <Clock size={13} strokeWidth={1.8} aria-hidden />
                {s.duracao}
              </span>
            </div>
            <span
              aria-hidden
              className={[
                'w-6 h-6 rounded-full flex items-center justify-center flex-none',
                selecionado ? 'bg-ink-text text-ink' : 'border border-field',
              ].join(' ')}
            >
              {selecionado && <Check size={14} strokeWidth={1.8} />}
            </span>
          </button>
        )
      })}
    </div>
  )
}
