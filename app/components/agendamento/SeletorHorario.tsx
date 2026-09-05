'use client'

import { hhmmParaMinutos } from '@/lib/agenda'

// ─────────────────────────────────────────────────────────────────────────────
// Grade de horários como botões, agrupada em Manhã / Tarde / Noite.
//
// Substitui o <select> nativo que a pública e a interna usavam. Referência de
// padrão: Zocdoc (chips preenchidos em grid, com cabeçalho por bloco).
//
// Recebe `horarios` já resolvido por useDisponibilidade — ou seja, já sem os
// ocupados e sem os que passaram. Este componente não faz regra de negócio.
//
// Só trabalha com strings 'HH:MM'; nenhuma aritmética de Date, nenhum risco
// com a convenção naive-UTC.
// ─────────────────────────────────────────────────────────────────────────────

const BLOCOS = [
  { chave: 'manha', label: 'Manhã', inicio: 0,        fim: 12 * 60 },
  { chave: 'tarde', label: 'Tarde', inicio: 12 * 60,  fim: 18 * 60 },
  { chave: 'noite', label: 'Noite', inicio: 18 * 60,  fim: 24 * 60 },
] as const

type Props = {
  /** Horários livres. null = ainda não escolheu data. */
  horarios: string[] | null
  valor: string
  onChange: (horario: string) => void
  diaFechado: boolean
  lotado: boolean
  carregando: boolean
}

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-10 text-center">
      <p className="text-sm text-gray-500">{children}</p>
    </div>
  )
}

export default function SeletorHorario({
  horarios, valor, onChange, diaFechado, lotado, carregando,
}: Props) {
  if (horarios === null) {
    return <Aviso>Escolha uma data para ver os horários.</Aviso>
  }
  if (diaFechado) {
    return <Aviso>Fechado neste dia. Escolha outra data.</Aviso>
  }
  if (carregando && horarios.length === 0) {
    return <Aviso>Carregando horários…</Aviso>
  }
  if (lotado || horarios.length === 0) {
    return <Aviso>Todos os horários deste dia já foram reservados.</Aviso>
  }

  // O primeiro da lista é o mais cedo ainda livre — a lista já vem ordenada e
  // sem os horários que passaram.
  const proximo = horarios[0]

  const grupos = BLOCOS
    .map(bloco => ({
      ...bloco,
      slots: horarios.filter(h => {
        const min = hhmmParaMinutos(h)
        return min >= bloco.inicio && min < bloco.fim
      }),
    }))
    .filter(g => g.slots.length > 0)

  return (
    <div className="space-y-7">
      {grupos.map(grupo => (
        <div key={grupo.chave}>
          <div className="flex items-baseline justify-between mb-3">
            <h4 className="text-xs uppercase tracking-widest font-semibold text-gray-500">
              {grupo.label}
            </h4>
            <span className="text-xs text-gray-400">
              {grupo.slots.length} {grupo.slots.length === 1 ? 'horário' : 'horários'}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {grupo.slots.map(h => {
              const selecionado = valor === h
              const ehProximo = h === proximo && !selecionado
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => onChange(h)}
                  aria-pressed={selecionado}
                  className={[
                    'relative py-3 rounded-xl text-sm font-semibold transition-all duration-150',
                    selecionado
                      ? 'bg-[#25D366] text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-[#25D366] hover:text-[#128C7E]',
                    ehProximo ? 'ring-2 ring-[#25D366]/30 border-[#25D366]' : '',
                  ].join(' ')}
                >
                  {h}
                </button>
              )
            })}
          </div>

          {grupo.slots.includes(proximo) && valor !== proximo && (
            <p className="mt-2.5 text-xs text-[#128C7E] font-medium">
              {proximo} é o próximo disponível
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
