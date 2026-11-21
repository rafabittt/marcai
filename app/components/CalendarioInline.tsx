'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { horariosDoDia, localDateStr, type HorariosMap } from '@/lib/agenda'

const DIAS_SEMANA_ABREV = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function toLocalDateString(date: Date): string {
  return localDateStr(date)
}

interface Props {
  value: string
  onChange: (value: string) => void
  maxDias?: number
  horarios?: HorariosMap | null
}

export default function CalendarioInline({ value, onChange, maxDias = 60, horarios }: Props) {
  const hoje = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const [mesAtual, setMesAtual] = useState<{ ano: number; mes: number }>({
    ano: hoje.getFullYear(),
    mes: hoje.getMonth(),
  })

  const diasDoMes = useMemo(() => {
    const { ano, mes } = mesAtual
    const primeiroDia = new Date(ano, mes, 1).getDay()  // 0=Dom
    const totalDias = new Date(ano, mes + 1, 0).getDate()
    const cells: (number | null)[] = []
    for (let i = 0; i < primeiroDia; i++) cells.push(null)
    for (let d = 1; d <= totalDias; d++) cells.push(d)
    return cells
  }, [mesAtual])

  const limite = useMemo(() => {
    const d = new Date(hoje)
    d.setDate(hoje.getDate() + maxDias)
    return d
  }, [hoje, maxDias])

  function isPastOrBeyond(dia: number): boolean {
    const d = new Date(mesAtual.ano, mesAtual.mes, dia)
    return d < hoje || d > limite
  }

  // Um dia está indisponível quando não sobra nenhum horário nele — isso
  // cobre dia fechado, dia inativo e folga do negócio, com a mesma regra
  // usada pelas telas de agendamento.
  function isClosed(dia: number): boolean {
    if (!horarios) return false
    const dataStr = toLocalDateString(new Date(mesAtual.ano, mesAtual.mes, dia))
    return horariosDoDia(horarios, dataStr).length === 0
  }

  function handlePrevMes() {
    setMesAtual(({ ano, mes }) => {
      if (mes === 0) return { ano: ano - 1, mes: 11 }
      return { ano, mes: mes - 1 }
    })
  }

  function handleNextMes() {
    setMesAtual(({ ano, mes }) => {
      if (mes === 11) return { ano: ano + 1, mes: 0 }
      return { ano, mes: mes + 1 }
    })
  }

  const podePrev = useMemo(() => {
    return mesAtual.ano > hoje.getFullYear() || mesAtual.mes > hoje.getMonth()
  }, [mesAtual, hoje])

  function handleDia(dia: number) {
    if (isPastOrBeyond(dia) || isClosed(dia)) return
    const d = new Date(mesAtual.ano, mesAtual.mes, dia)
    onChange(toLocalDateString(d))
  }

  // Visual Grafite: um cartão só (sem caixa dentro). Dia livre parece botão
  // (borda fina), dia sem horário fica apagado e desligado, o escolhido fica
  // preto como a aba ativa. O verde aparece só na bolinha de "hoje".
  return (
    <div className="card p-4 sm:p-5 select-none">
      {/* Navegação do mês */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={handlePrevMes}
          disabled={!podePrev}
          className="btn btn-ghost btn-icon w-11 h-11"
          aria-label="Mês anterior"
        >
          <ChevronLeft size={20} strokeWidth={1.8} />
        </button>
        <span className="t-section" aria-live="polite">
          {MESES_NOMES[mesAtual.mes]} {mesAtual.ano}
        </span>
        <button
          type="button"
          onClick={handleNextMes}
          className="btn btn-ghost btn-icon w-11 h-11"
          aria-label="Próximo mês"
        >
          <ChevronRight size={20} strokeWidth={1.8} />
        </button>
      </div>

      {/* Cabeçalho dias da semana */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DIAS_SEMANA_ABREV.map(d => (
          <div key={d} className="t-cap text-center text-faint py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grid de dias */}
      <div className="grid grid-cols-7 gap-1">
        {diasDoMes.map((dia, idx) => {
          if (dia === null) {
            return <div key={`empty-${idx}`} />
          }

          const dateStr = toLocalDateString(new Date(mesAtual.ano, mesAtual.mes, dia))
          const disabled = isPastOrBeyond(dia) || isClosed(dia)
          const selected = value === dateStr
          const isHoje = toLocalDateString(hoje) === dateStr

          let cellClass = 'relative w-full max-w-12 mx-auto aspect-square min-h-11 flex items-center justify-center rounded-full text-[15px] tabular border transition-[background-color,border-color,transform] duration-150 ease-grafite '
          if (selected) {
            cellClass += 'bg-ink text-ink-text border-transparent font-semibold'
          } else if (disabled) {
            cellClass += 'border-transparent text-faint opacity-50'
          } else {
            cellClass += 'border-hairline text-fg font-medium hover:bg-fill active:scale-[.94]'
          }

          return (
            <button
              key={dia}
              type="button"
              onClick={() => handleDia(dia)}
              disabled={disabled}
              aria-pressed={selected}
              aria-current={isHoje ? 'date' : undefined}
              className={cellClass}
            >
              {dia}
              {isHoje && (
                <span aria-hidden className="absolute bottom-1.5 w-1 h-1 rounded-full bg-accent" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
