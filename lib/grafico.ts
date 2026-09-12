// ─────────────────────────────────────────────────────────────────────────────
// Séries temporais do gráfico de volume.
//
// Tudo aqui trabalha com 'YYYY-MM-DD'. Os agendamentos vêm em naive-UTC, e a
// data é extraída por fatia de string (dataDe), nunca parseando para Date — o
// que deslocaria o dia em fusos a oeste. As datas do eixo são construídas a
// partir das PARTES (ano, mês, dia), que é TZ-independente.
//
// O eixo é CONTÍNUO: todo dia (ou semana) do período aparece, inclusive os
// zerados. Pular datas sem dado encosta meses diferentes lado a lado e faz a
// tendência mentir.
// ─────────────────────────────────────────────────────────────────────────────

import { dataDe, localDateStr } from './agenda.ts'

export type Agrupamento = 'dia' | 'semana'

export type Bucket = {
  /** Data de início do bucket, 'YYYY-MM-DD'. Identidade da barra. */
  chave: string
  /** Último dia coberto, inclusive. Igual a `chave` no agrupamento por dia. */
  fim: string
  rotulo: string
}

export type Ponto = Bucket & {
  Realizados: number
  Cancelados: number
  total: number
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** '2026-09-12' -> '12 set'. Formato fixo, sem depender do ICU da máquina. */
export function rotuloData(dataStr: string): string {
  const [, mes, dia] = dataStr.split('-').map(Number)
  return `${dia} ${MESES[mes - 1]}`
}

/** Soma dias a uma data 'YYYY-MM-DD', pelas partes — sem passar por UTC. */
export function somarDias(dataStr: string, dias: number): string {
  const [ano, mes, dia] = dataStr.split('-').map(Number)
  return localDateStr(new Date(ano, mes - 1, dia + dias))
}

/**
 * Os buckets do período que termina em `fim` (inclusive) e cobre `dias` dias.
 *
 * No agrupamento por semana os buckets têm 7 dias a partir do início; o último
 * é recortado em `fim`, então uma semana parcial não estende o período.
 */
export function gerarBuckets(fim: string, dias: number, agrupamento: Agrupamento): Bucket[] {
  const inicio = somarDias(fim, -(dias - 1))
  const passo = agrupamento === 'semana' ? 7 : 1
  const buckets: Bucket[] = []

  for (let d = inicio; d <= fim; d = somarDias(d, passo)) {
    const ultimo = somarDias(d, passo - 1)
    buckets.push({
      chave: d,
      fim: ultimo > fim ? fim : ultimo,
      rotulo: rotuloData(d),
    })
  }
  return buckets
}

/** Distribui os agendamentos nos buckets. Fora do período são ignorados. */
export function agruparAgendamentos(
  linhas: { data_hora: string; status: string }[],
  buckets: Bucket[],
): Ponto[] {
  const pontos: Ponto[] = buckets.map(b => ({ ...b, Realizados: 0, Cancelados: 0, total: 0 }))
  if (pontos.length === 0) return pontos

  for (const linha of linhas) {
    const dia = dataDe(linha.data_hora)
    // Busca linear: o período tem no máximo 90 buckets.
    const p = pontos.find(b => dia >= b.chave && dia <= b.fim)
    if (!p) continue
    if (linha.status === 'cancelado') p.Cancelados++
    else p.Realizados++
    p.total++
  }
  return pontos
}

/** Variação percentual de `atual` sobre `anterior`. null quando não dá para comparar. */
export function variacao(atual: number, anterior: number): number | null {
  if (anterior === 0) return atual === 0 ? 0 : null
  return Math.round(((atual - anterior) / anterior) * 100)
}

/**
 * De quantos em quantos buckets colocar um rótulo no eixo, para caber sem
 * empilhar texto. Recharts recebe isto como `interval`.
 */
export function intervaloTicks(qtdBuckets: number, maxTicks = 7): number {
  if (qtdBuckets <= maxTicks) return 0
  return Math.ceil(qtdBuckets / maxTicks) - 1
}
