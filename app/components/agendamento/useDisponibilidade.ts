'use client'

import { useEffect, useMemo, useState } from 'react'
import { horariosDoDia, horariosLivres as calcularLivres, type HorariosMap } from '@/lib/agenda'

// ─────────────────────────────────────────────────────────────────────────────
// Disponibilidade de horários para uma data.
//
// Antes desta extração, este bloco vivia copiado literalmente em
// app/agendar/[slug]/page.tsx e app/agendar-interno/page.tsx: o mesmo fetch de
// ocupados, os mesmos dois useMemo e o mesmo cálculo de diaFechado.
//
// Tudo aqui trabalha com strings 'HH:MM' e 'YYYY-MM-DD'. Nenhuma aritmética de
// Date acontece neste arquivo — a convenção naive-UTC do lib/agenda.ts fica
// contida nos helpers de lá.
// ─────────────────────────────────────────────────────────────────────────────

export type Disponibilidade = {
  /** Horários da grade em que o negócio abre nesta data. null antes de escolher data. */
  disponiveis: string[] | null
  /** Os disponíveis menos ocupados e menos os que já passaram. null antes de escolher data. */
  livres: string[] | null
  /** O negócio não atende nesta data (fechado, inativo ou folga). */
  diaFechado: boolean
  /** Data escolhida, mas sem nenhum horário livre — todos já foram tomados. */
  lotado: boolean
  carregando: boolean
}

export function useDisponibilidade(
  negocioId: string | undefined,
  horarios: HorariosMap | null | undefined,
  data: string,
  profissionalId: string,
): Disponibilidade {
  const [ocupados, setOcupados] = useState<string[]>([])
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    if (!data || !negocioId) { setOcupados([]); return }
    let cancelado = false
    setCarregando(true)
    const params = new URLSearchParams({ negocio_id: negocioId, data })
    if (profissionalId) params.set('profissional_id', profissionalId)
    fetch(`/api/agendar/ocupados?${params}`)
      .then(r => r.json())
      .then(({ ocupados: slots }) => { if (!cancelado) setOcupados(slots ?? []) })
      .catch(() => { if (!cancelado) setOcupados([]) })
      .finally(() => { if (!cancelado) setCarregando(false) })
    // Resposta antiga não pode sobrescrever a nova quando o usuário troca de
    // data rápido — daí o flag de cancelamento.
    return () => { cancelado = true }
  }, [data, negocioId, profissionalId])

  const disponiveis = useMemo<string[] | null>(() => {
    if (!data) return null
    return horariosDoDia(horarios, data)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, JSON.stringify(horarios)])

  const livres = useMemo(() => {
    if (!disponiveis) return null
    return calcularLivres(disponiveis, ocupados, data)
  }, [disponiveis, ocupados, data])

  const diaFechado = disponiveis !== null && disponiveis.length === 0
  const lotado = !diaFechado && livres !== null && livres.length === 0

  return { disponiveis, livres, diaFechado, lotado, carregando }
}
