'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import Abas from './Abas'
import { localDateStr } from '@/lib/agenda'
import {
  gerarBuckets, agruparAgendamentos, somarDias, variacao, intervaloTicks,
  rotuloData, type Agrupamento, type Ponto,
} from '@/lib/grafico'

// ─────────────────────────────────────────────────────────────────────────────
// Volume de agendamentos no tempo.
//
// Faz a própria consulta por período em vez de reaproveitar a lista paginada do
// histórico: a lista só tem o que já foi carregado por "Ver mais", então o
// gráfico montado em cima dela mostrava um recorte arbitrário.
//
// O eixo é contínuo — todo dia do período aparece, mesmo zerado. Antes só os
// dias COM agendamento viravam coluna, o que encostava datas de meses
// diferentes lado a lado e distorcia a tendência.
// ─────────────────────────────────────────────────────────────────────────────

const PERIODOS = [
  { dias: 7,  rotulo: '7 dias',  agrupamento: 'dia'    as Agrupamento },
  { dias: 30, rotulo: '30 dias', agrupamento: 'dia'    as Agrupamento },
  { dias: 90, rotulo: '90 dias', agrupamento: 'semana' as Agrupamento },
]

// Cores do Grafite: barra cheia na cor da marca; cancelado em cinza (o
// vermelho fica para erro de verdade). Variáveis CSS para servir no claro e no
// escuro.
const VERDE  = 'var(--accent)'
const CINZA  = 'var(--fill-strong)'

type Linha = { data_hora: string; status: string }

function Variacao({ pct }: { pct: number | null }) {
  if (pct === null) {
    return <span className="t-cap">sem base de comparação</span>
  }
  const neutro = pct === 0
  const sobe = pct > 0
  const Icone = neutro ? Minus : sobe ? TrendingUp : TrendingDown
  const cor = neutro ? 'text-muted' : sobe ? 'text-accent-ink' : 'text-bad-ink'
  return (
    <span className={`inline-flex items-center gap-1 text-[12px] font-semibold tabular ${cor}`}>
      <Icone size={13} aria-hidden />
      {neutro ? 'estável' : `${sobe ? '+' : ''}${pct}%`}
      <span className="text-muted font-normal">vs. período anterior</span>
    </span>
  )
}

function TooltipCustom({ active, payload }: {
  active?: boolean
  payload?: { payload: Ponto }[]
}) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  const periodo = p.chave === p.fim
    ? rotuloData(p.chave)
    : `${rotuloData(p.chave)} – ${rotuloData(p.fim)}`
  return (
    <div className="sheet !rounded-[10px] px-3.5 py-2.5 text-[12px] text-fg">
      <p className="font-semibold mb-1.5">{periodo}</p>
      <p className="flex items-center gap-1.5 text-muted tabular">
        <span className="w-2 h-2 rounded-full" style={{ background: VERDE }} />
        {p.Realizados} realizado{p.Realizados === 1 ? '' : 's'}
      </p>
      <p className="flex items-center gap-1.5 text-muted mt-0.5 tabular">
        <span className="w-2 h-2 rounded-full" style={{ background: CINZA }} />
        {p.Cancelados} cancelado{p.Cancelados === 1 ? '' : 's'}
      </p>
    </div>
  )
}

export default function GraficoVolume({ negocioId }: { negocioId: string | null }) {
  const [dias, setDias] = useState(30)
  // null = ainda buscando. Deriva o "carregando" em vez de guardar um segundo
  // estado, o que evitaria ter que sincronizar os dois.
  const [linhas, setLinhas] = useState<Linha[] | null>(null)

  const supabase = useMemo(() => createClient(), [])
  const periodo = PERIODOS.find(p => p.dias === dias) ?? PERIODOS[1]
  const carregando = linhas === null && negocioId !== null

  useEffect(() => {
    if (!negocioId) return
    let vivo = true
    const hoje = localDateStr()
    // Puxa o dobro do período de uma vez: a metade antiga serve de base para a
    // variação, sem uma segunda ida ao banco.
    const desde = somarDias(hoje, -(dias * 2 - 1))
    supabase
      .from('agendamentos')
      .select('data_hora, status')
      .eq('negocio_id', negocioId)
      .eq('tipo', 'agendamento')
      .gte('data_hora', `${desde}T00:00:00.000Z`)
      .lte('data_hora', `${hoje}T23:59:59.999Z`)
      // Estado só no callback: setState síncrono no corpo do efeito dispara
      // renders em cascata. Resposta antiga não sobrescreve a nova.
      .then(({ data }) => { if (vivo) setLinhas(data ?? []) })
    return () => { vivo = false }
  }, [negocioId, dias, supabase])

  const { pontos, total, realizados, cancelados, pct } = useMemo(() => {
    const dados = linhas ?? []
    const hoje = localDateStr()
    const buckets = gerarBuckets(hoje, dias, periodo.agrupamento)
    const pontos = agruparAgendamentos(dados, buckets)

    const inicioAtual = somarDias(hoje, -(dias - 1))
    const noAtual = dados.filter(l => l.data_hora.slice(0, 10) >= inicioAtual)
    const noAnterior = dados.filter(l => l.data_hora.slice(0, 10) < inicioAtual)

    return {
      pontos,
      total: noAtual.length,
      realizados: noAtual.filter(l => l.status !== 'cancelado').length,
      cancelados: noAtual.filter(l => l.status === 'cancelado').length,
      pct: variacao(noAtual.length, noAnterior.length),
    }
  }, [linhas, dias, periodo.agrupamento])

  return (
    <div className="card">

      {/* Cabeçalho — o número lidera */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div className="min-w-0">
          <p className="t-label mb-2.5">Agendamentos no período</p>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className={`t-num tabular ${carregando ? '!text-faint' : ''}`}>
              {carregando ? '—' : total}
            </span>
            {!carregando && <Variacao pct={pct} />}
          </div>
          {!carregando && total > 0 && (
            <p className="t-cap mt-1.5 tabular">
              {realizados} realizado{realizados === 1 ? '' : 's'}
              <span className="mx-1.5" aria-hidden>·</span>
              {cancelados} cancelado{cancelados === 1 ? '' : 's'}
            </p>
          )}
        </div>

        <Abas
          pequeno
          rotulo="Período"
          valor={dias}
          onChange={d => { setDias(d); setLinhas(null) }}
          opcoes={PERIODOS.map(p => [p.dias, p.rotulo] as const)}
        />
      </div>

      {carregando ? (
        <div className="h-[220px]" />
      ) : total === 0 ? (
        <div className="h-[220px] flex flex-col items-center justify-center text-center">
          <p className="text-[15px] font-medium text-fg">Nenhum agendamento nos últimos {dias} dias.</p>
          <p className="t-cap mt-1">
            Assim que começarem a entrar, o volume aparece aqui.
          </p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pontos} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="18%">
              <CartesianGrid stroke="var(--hairline)" vertical={false} />
              <XAxis
                dataKey="rotulo"
                tick={{ fontSize: 11, fill: 'var(--muted)' }}
                axisLine={false}
                tickLine={false}
                interval={intervaloTicks(pontos.length)}
                tickMargin={8}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: 'var(--muted)' }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip content={<TooltipCustom />} cursor={{ fill: 'var(--fill)' }} />
              <Bar dataKey="Realizados" stackId="v" fill={VERDE} isAnimationActive={false} />
              <Bar dataKey="Cancelados" stackId="v" fill={CINZA} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>

          {/* Legenda discreta */}
          <div className="flex items-center gap-4 mt-4 pl-1">
            <span className="inline-flex items-center gap-1.5 t-cap">
              <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: VERDE }} />
              Realizados
            </span>
            <span className="inline-flex items-center gap-1.5 t-cap">
              <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: CINZA }} />
              Cancelados
            </span>
            {periodo.agrupamento === 'semana' && (
              <span className="t-cap ml-auto">por semana</span>
            )}
          </div>
        </>
      )}
    </div>
  )
}
