'use client'

import { useMemo, useState } from 'react'

const DIAS_SEMANA_ABREV = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

interface Props {
  value: string       // 'YYYY-MM-DD' ou ''
  onChange: (value: string) => void
  maxDias?: number    // quantos dias à frente permitir (padrão 60)
}

export default function CalendarioInline({ value, onChange, maxDias = 60 }: Props) {
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
    if (isPastOrBeyond(dia)) return
    const d = new Date(mesAtual.ano, mesAtual.mes, dia)
    onChange(toLocalDateString(d))
  }

  return (
    <div className="border border-gray-200 rounded-2xl p-4 bg-white select-none">
      {/* Navegação do mês */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePrevMes}
          disabled={!podePrev}
          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Mês anterior"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-gray-800">
          {MESES_NOMES[mesAtual.mes]} {mesAtual.ano}
        </span>
        <button
          type="button"
          onClick={handleNextMes}
          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Próximo mês"
        >
          ›
        </button>
      </div>

      {/* Cabeçalho dias da semana */}
      <div className="grid grid-cols-7 mb-1">
        {DIAS_SEMANA_ABREV.map(d => (
          <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grid de dias */}
      <div className="grid grid-cols-7 gap-y-1">
        {diasDoMes.map((dia, idx) => {
          if (dia === null) {
            return <div key={`empty-${idx}`} />
          }

          const dateStr = toLocalDateString(new Date(mesAtual.ano, mesAtual.mes, dia))
          const disabled = isPastOrBeyond(dia)
          const selected = value === dateStr
          const isHoje = toLocalDateString(hoje) === dateStr

          let cellClass = 'w-full aspect-square flex items-center justify-center rounded-full text-sm transition-colors '
          if (selected) {
            cellClass += 'bg-[#25D366] text-white font-semibold'
          } else if (disabled) {
            cellClass += 'text-gray-300 cursor-not-allowed'
          } else if (isHoje) {
            cellClass += 'text-[#25D366] font-semibold hover:bg-[#dcfce7] cursor-pointer'
          } else {
            cellClass += 'text-gray-700 hover:bg-gray-100 cursor-pointer'
          }

          return (
            <button
              key={dia}
              type="button"
              onClick={() => handleDia(dia)}
              disabled={disabled}
              className={cellClass}
            >
              {dia}
            </button>
          )
        })}
      </div>
    </div>
  )
}
