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

/** Aviso calmo no lugar da grade (sem data, dia fechado, lotado...).
 *  Exportado para o FluxoAgendamento usar o mesmo nos outros passos. */
export function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-card bg-fill px-5 py-8 text-center">
      <p className="text-[14px] text-muted">{children}</p>
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

  // Visual Grafite: horário livre é um botão em pílula com borda fina; o
  // escolhido fica preto (como a aba ativa). O verde só aparece na bolinha
  // do "próximo disponível", sempre junto do texto que explica.
  return (
    <div className="space-y-6">
      {grupos.map(grupo => (
        <div key={grupo.chave}>
          <div className="flex items-baseline justify-between mb-2.5">
            <h4 className="t-label">{grupo.label}</h4>
            <span className="t-cap tabular text-faint">
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
                    'btn relative h-11 tabular text-[15px]',
                    selecionado ? 'bg-ink text-ink-text border-transparent' : '',
                  ].join(' ')}
                >
                  {h}
                  {ehProximo && (
                    <span aria-hidden className="absolute top-1.5 right-2.5 w-1.5 h-1.5 rounded-full bg-accent" />
                  )}
                </button>
              )
            })}
          </div>

          {grupo.slots.includes(proximo) && valor !== proximo && (
            <p className="mt-2.5 t-cap flex items-center gap-1.5">
              <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-accent flex-none" />
              <span><span className="tabular">{proximo}</span> é o próximo disponível</span>
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
