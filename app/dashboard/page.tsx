'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { CalendarClock, CalendarCheck, Clock3, ChevronDown } from 'lucide-react'
import SidebarLayout from '@/app/components/SidebarLayout'
import GooLoader from '@/app/components/GooLoader'
import {
  localDateStr, naiveNowISO, horaDe, dataDe, montarDataHora,
  horariosDoDia, horariosLivres, type HorariosMap,
} from '@/lib/agenda'
import StatusBadge from '@/app/components/StatusBadge'
import MetricCard from '@/app/components/MetricCard'
import InfoRow from '@/app/components/InfoRow'
import PainelLateral from '@/app/components/PainelLateral'

const POR_PAGINA = 10
const PROXIMOS_NA_HOME = 5

type Agendamento = {
  id: string
  cliente_nome: string
  cliente_telefone: string
  servico: string
  profissional: string | null
  data_hora: string
  status: string
}

const CAMPOS = 'id, cliente_nome, cliente_telefone, servico, profissional, data_hora, status'

function inicialAvatar(nome: string) {
  return nome.trim().charAt(0).toUpperCase()
}

// Convenção "naive UTC" e helpers de data vivem em lib/agenda.ts.
function formatarDataHora(iso: string) {
  const hoje  = localDateStr()
  const amanhaDate = new Date(); amanhaDate.setDate(amanhaDate.getDate() + 1)
  const amanha = localDateStr(amanhaDate)
  const dateStr = dataDe(iso)
  const hora = horaDe(iso)
  if (dateStr === hoje)   return `Hoje, ${hora}`
  if (dateStr === amanha) return `Amanhã, ${hora}`
  const [y, mo, dy] = dateStr.split('-').map(Number)
  const label = new Date(y, mo - 1, dy).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  return `${label}, ${hora}`
}

function saudacao(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function dataExtenso(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

type Aba = 'agenda' | 'historico'

export default function DashboardPage() {
  const [nomeNegocio,      setNomeNegocio]      = useState<string | null>(null)
  const [agendamentosHoje, setAgendamentosHoje] = useState<Agendamento[]>([])
  const [proximos,         setProximos]         = useState<Agendamento[]>([])
  const [passados,         setPassados]         = useState<Agendamento[]>([])
  const [temMaisPassados,  setTemMaisPassados]  = useState(false)
  const [carregandoMais,   setCarregandoMais]   = useState(false)
  const [vagosHoje,        setVagosHoje]        = useState<number | null>(null)
  const [totalGradeHoje,   setTotalGradeHoje]   = useState(0)
  const [loading,          setLoading]          = useState(true)
  const [aba,              setAba]              = useState<Aba>('agenda')

  const [selecionado, setSelecionado] = useState<Agendamento | null>(null)
  const [reagendando, setReagendando] = useState(false)
  const [novaData,    setNovaData]    = useState('')
  const [novoHorario, setNovoHorario] = useState('')
  const [salvando,    setSalvando]    = useState(false)

  const [mostrarCanceladosHoje,     setMostrarCanceladosHoje]     = useState(false)
  const [mostrarCanceladosProximos, setMostrarCanceladosProximos] = useState(false)

  const [negocioId, setNegocioId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const { data: neg } = await supabase
        .from('negocios')
        .select('id, nome, horarios')
        .eq('user_id', user.id)
        .maybeSingle()

      setNomeNegocio(neg?.nome ?? null)
      setNegocioId(neg?.id ?? null)

      const hojeStr    = localDateStr()
      const inicioHoje = `${hojeStr}T00:00:00.000Z`
      const fimHoje    = `${hojeStr}T23:59:59.999Z`

      // Filtro explícito por negocio_id. A RLS já isola o dono, mas depender
      // só dela deixava a query correta por acidente.
      const base = () => {
        const q = supabase.from('agendamentos').select(CAMPOS)
        return neg?.id ? q.eq('negocio_id', neg.id) : q
      }

      const [{ data: dHoje }, { data: dProx }, { data: dPass }] = await Promise.all([
        base().gte('data_hora', inicioHoje).lte('data_hora', fimHoje).order('data_hora', { ascending: true }),
        base().gte('data_hora', naiveNowISO()).order('data_hora', { ascending: true }).limit(20),
        base().lt('data_hora', inicioHoje).order('data_hora', { ascending: false }).range(0, POR_PAGINA),
      ])

      setAgendamentosHoje(dHoje ?? [])
      setProximos(dProx ?? [])
      // Pede POR_PAGINA+1 para saber se há próxima página sem uma contagem extra.
      setTemMaisPassados((dPass ?? []).length > POR_PAGINA)
      setPassados((dPass ?? []).slice(0, POR_PAGINA))

      // Horários vagos de hoje. Reusa a mesma rota que as telas de agendamento
      // usam, então duração de serviço e buffer entram na conta do mesmo jeito.
      const horarios = neg?.horarios as HorariosMap | null | undefined
      const grade = horariosDoDia(horarios, hojeStr)
      setTotalGradeHoje(grade.length)
      if (neg?.id && grade.length > 0) {
        try {
          const res = await fetch(`/api/agendar/ocupados?negocio_id=${neg.id}&data=${hojeStr}`)
          const { ocupados } = await res.json()
          setVagosHoje(horariosLivres(grade, ocupados ?? [], hojeStr).length)
        } catch {
          setVagosHoje(null)
        }
      } else {
        setVagosHoje(0)
      }

      setLoading(false)
    }
    init()
  }, [])

  const carregarMaisPassados = useCallback(async () => {
    if (!negocioId) return
    setCarregandoMais(true)
    const inicioHoje = `${localDateStr()}T00:00:00.000Z`
    const de = passados.length
    const { data } = await supabase
      .from('agendamentos')
      .select(CAMPOS)
      .eq('negocio_id', negocioId)
      .lt('data_hora', inicioHoje)
      .order('data_hora', { ascending: false })
      .range(de, de + POR_PAGINA)
    setTemMaisPassados((data ?? []).length > POR_PAGINA)
    setPassados(prev => [...prev, ...(data ?? []).slice(0, POR_PAGINA)])
    setCarregandoMais(false)
  }, [negocioId, passados.length])

  const agora = naiveNowISO()

  // ── Resumo do dia ──
  const ativosHoje = useMemo(
    () => agendamentosHoje.filter(a => a.status !== 'cancelado'),
    [agendamentosHoje],
  )
  const proximoCliente = useMemo(
    () => ativosHoje.find(a => a.data_hora >= agora) ?? null,
    [ativosHoje, agora],
  )

  const chartData = useMemo(() => {
    const byDay: Record<string, { Realizados: number; Cancelados: number }> = {}
    passados.forEach(ag => {
      const day = dataDe(ag.data_hora)
      if (!byDay[day]) byDay[day] = { Realizados: 0, Cancelados: 0 }
      if (ag.status === 'cancelado') byDay[day].Cancelados++
      else byDay[day].Realizados++
    })
    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([date, counts]) => ({
        dia: new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        ...counts,
      }))
  }, [passados])

  function abrirPainel(ag: Agendamento) {
    setSelecionado(ag)
    setReagendando(false)
    setNovaData(dataDe(ag.data_hora))
    setNovoHorario(horaDe(ag.data_hora))
  }

  function fecharPainel() {
    setSelecionado(null)
    setReagendando(false)
    setSalvando(false)
  }

  function atualizarLista(id: string, campos: Partial<Agendamento>) {
    const patch = (lista: Agendamento[]) => lista.map(a => a.id === id ? { ...a, ...campos } : a)
    setAgendamentosHoje(patch)
    setProximos(patch)
    setPassados(patch)
  }

  async function cancelar() {
    if (!selecionado) return
    setSalvando(true)
    await supabase.from('agendamentos').update({ status: 'cancelado' }).eq('id', selecionado.id)
    atualizarLista(selecionado.id, { status: 'cancelado' })
    setSelecionado(prev => prev ? { ...prev, status: 'cancelado' } : prev)
    setSalvando(false)
  }

  async function reagendar() {
    if (!selecionado || !novaData || !novoHorario) return
    setSalvando(true)
    const novaDataHora = montarDataHora(novaData, novoHorario)
    await supabase.from('agendamentos')
      .update({ data_hora: novaDataHora, status: 'confirmado' })
      .eq('id', selecionado.id)
    atualizarLista(selecionado.id, { data_hora: novaDataHora, status: 'confirmado' })
    setSelecionado(prev => prev ? { ...prev, data_hora: novaDataHora, status: 'confirmado' } : prev)
    setReagendando(false)
    setSalvando(false)
  }

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64"><GooLoader /></div>
      </SidebarLayout>
    )
  }

  const isPassado = selecionado ? selecionado.data_hora < agora : false
  const ocupadosHoje = totalGradeHoje > 0 && vagosHoje !== null ? totalGradeHoje - vagosHoje : 0

  return (
    <SidebarLayout>
      <main className="max-w-3xl mx-auto px-5 sm:px-6 py-10 sm:py-12 space-y-10">

        {/* ── Saudação ── */}
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-1">
            {dataExtenso()}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: '#0a0a0a' }}>
            {saudacao()}{nomeNegocio ? `, ${nomeNegocio}!` : '!'}
          </h1>
        </div>

        {/* ── Resumo do dia ── */}
        <section>
          <h2 className="text-xs uppercase tracking-widest font-medium mb-5 text-gray-500">Resumo do dia</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              label="Próximo"
              value={proximoCliente ? horaDe(proximoCliente.data_hora) : '—'}
              valueColor={proximoCliente ? 'text-[#25D366]' : 'text-gray-300'}
              iconBg="bg-[#dcfce7]"
              icon={<CalendarClock size={18} className="text-[#25D366]" />}
              rodape={proximoCliente ? proximoCliente.cliente_nome : 'Nada mais para hoje'}
            />
            <MetricCard
              label="Hoje"
              value={ativosHoje.length}
              valueColor="text-gray-900"
              iconBg="bg-gray-100"
              icon={<CalendarCheck size={18} className="text-gray-500" />}
              rodape={ativosHoje.length === 1 ? '1 agendamento' : `${ativosHoje.length} agendamentos`}
            />
            <MetricCard
              label="Horários vagos"
              value={vagosHoje ?? '—'}
              valueColor="text-gray-900"
              iconBg="bg-gray-100"
              icon={<Clock3 size={18} className="text-gray-500" />}
              rodape={totalGradeHoje === 0 ? 'Fechado hoje' : `de ${totalGradeHoje} na grade`}
              progress={totalGradeHoje > 0 ? Math.round((ocupadosHoje / totalGradeHoje) * 100) : 0}
              progressColor="bg-[#25D366]"
            />
          </div>
        </section>

        {/* ── Abas ── */}
        <div className="flex gap-1 border-b border-gray-100">
          {([['agenda', 'Agenda'], ['historico', 'Histórico']] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setAba(id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                aba === id
                  ? 'border-[#25D366] text-[#0a0a0a]'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {aba === 'agenda' ? (
          <>
            <section>
              <div className="flex items-baseline justify-between mb-5">
                <h2 className="text-xs uppercase tracking-widest font-medium text-gray-500">Hoje</h2>
                <span className="text-xs text-gray-500 capitalize">
                  {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
              </div>
              <ListaComCancelados
                agendamentos={agendamentosHoje}
                vazio="Nenhum agendamento para hoje."
                mostrarCancelados={mostrarCanceladosHoje}
                onToggleCancelados={() => setMostrarCanceladosHoje(p => !p)}
                onAbrir={abrirPainel}
              />
            </section>

            <section>
              <div className="flex items-baseline justify-between mb-5">
                <h2 className="text-xs uppercase tracking-widest font-medium text-gray-500">
                  Próximos agendamentos
                </h2>
                {proximos.filter(a => a.status !== 'cancelado').length > PROXIMOS_NA_HOME && (
                  <span className="text-xs text-gray-400">os {PROXIMOS_NA_HOME} mais próximos</span>
                )}
              </div>
              <ListaComCancelados
                agendamentos={proximos}
                vazio="Nenhum agendamento futuro."
                mostrarCancelados={mostrarCanceladosProximos}
                onToggleCancelados={() => setMostrarCanceladosProximos(p => !p)}
                onAbrir={abrirPainel}
                limite={PROXIMOS_NA_HOME}
              />
            </section>
          </>
        ) : (
          <>
            {/* Abre a aba: dá a leitura do período antes do item a item.
                Vive junto do histórico, e não na home, para ela não crescer.
                Reflete o que já foi carregado pela paginação abaixo. */}
            <section>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 sm:px-6 pt-6 pb-4">
                <p className="text-xs uppercase tracking-widest font-medium text-gray-500 mb-4">
                  Volume diário — últimos dias
                </p>
                {chartData.length === 0 ? (
                  <div className="flex items-center justify-center h-40">
                    <p className="text-sm text-gray-400">Sem dados históricos ainda.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} barSize={18} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={24} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: '1px solid #f0f0f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }}
                        cursor={{ fill: '#f9f9f9' }}
                      />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
                      <Bar dataKey="Realizados" fill="#25D366" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Cancelados" fill="#fca5a5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>
            <section>
              <h2 className="text-xs uppercase tracking-widest font-medium mb-5 text-gray-500">Histórico</h2>
              {passados.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                  <p className="text-gray-500 text-sm">Nenhum agendamento realizado.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {passados.map(ag => (
                      <AgendamentoCard key={ag.id} ag={ag} onAbrir={abrirPainel} passado />
                    ))}
                  </div>
                  {temMaisPassados && (
                    <button
                      onClick={carregarMaisPassados}
                      disabled={carregandoMais}
                      className="mt-4 w-full py-3 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      {carregandoMais ? 'Carregando...' : `Ver mais ${POR_PAGINA}`}
                    </button>
                  )}
                  <p className="mt-3 text-center text-xs text-gray-400">
                    {passados.length} {passados.length === 1 ? 'agendamento' : 'agendamentos'} carregados
                  </p>
                </>
              )}
            </section>

          </>
        )}
      </main>

      {/* ── Painel lateral de detalhe ── */}
      <PainelLateral
        aberto={selecionado !== null}
        onFechar={fecharPainel}
        titulo={selecionado && (
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#dcfce7] flex items-center justify-center flex-shrink-0">
              <span className="text-base font-bold text-[#128C7E]">
                {inicialAvatar(selecionado.cliente_nome)}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-bold truncate" style={{ color: '#0a0a0a' }}>{selecionado.cliente_nome}</p>
              <StatusBadge status={selecionado.status} passado={isPassado} />
            </div>
          </div>
        )}
        rodape={selecionado && selecionado.status !== 'cancelado' && !isPassado ? (
          <div className="flex gap-3">
            <button
              onClick={cancelar}
              disabled={salvando}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-red-500 border-2 border-red-100 transition-all duration-200 hover:bg-red-50 hover:border-red-200 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={() => setReagendando(p => !p)}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-[#25D366] transition-all duration-200 hover:bg-[#128C7E]"
            >
              Reagendar
            </button>
          </div>
        ) : undefined}
      >
        {selecionado && (
          <>
            <div className="space-y-1">
              <InfoRow label="Telefone"       value={selecionado.cliente_telefone} />
              <InfoRow label="Serviço"        value={selecionado.servico} />
              {selecionado.profissional && <InfoRow label="Profissional" value={selecionado.profissional} />}
              <InfoRow label="Data e horário" value={formatarDataHora(selecionado.data_hora)} />
            </div>

            {reagendando && !isPassado && (
              <div className="bg-gray-50 rounded-xl p-4 mt-5 space-y-3">
                <p className="text-xs uppercase tracking-widest font-medium text-gray-500">
                  Nova data e horário
                </p>
                <div className="flex gap-3">
                  <input
                    type="date"
                    value={novaData}
                    onChange={e => setNovaData(e.target.value)}
                    className="flex-1 min-w-0 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                  />
                  <input
                    type="time"
                    value={novoHorario}
                    onChange={e => setNovoHorario(e.target.value)}
                    className="flex-1 min-w-0 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                  />
                </div>
                <button
                  onClick={reagendar}
                  disabled={salvando}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-[#25D366] transition-all duration-200 hover:bg-[#128C7E] disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Confirmar reagendamento'}
                </button>
              </div>
            )}
          </>
        )}
      </PainelLateral>
    </SidebarLayout>
  )
}

// ── AgendamentoCard ──────────────────────────────────────────────────────────

function AgendamentoCard({
  ag, onAbrir, passado = false,
}: {
  ag: Agendamento
  onAbrir: (ag: Agendamento) => void
  passado?: boolean
}) {
  const cancelado = ag.status === 'cancelado'
  const efetivamentePassado = passado || ag.data_hora < naiveNowISO()
  return (
    <button
      onClick={() => onAbrir(ag)}
      className={`w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm px-5 sm:px-6 py-4 sm:py-5 flex items-center gap-4 sm:gap-5 transition-all duration-150 hover:shadow-md hover:border-gray-200 ${cancelado ? 'opacity-60' : ''}`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${cancelado ? 'bg-gray-100' : 'bg-[#dcfce7]'}`}>
        <span className={`text-sm font-bold ${cancelado ? 'text-gray-500' : 'text-[#128C7E]'}`}>
          {inicialAvatar(ag.cliente_nome)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm truncate ${cancelado ? 'line-through text-gray-500' : ''}`} style={cancelado ? {} : { color: '#0a0a0a' }}>
          {ag.cliente_nome}
        </p>
        <p className={`text-sm truncate ${cancelado ? 'text-gray-500' : 'text-gray-600'}`}>
          {ag.servico}{ag.profissional ? ` · ${ag.profissional}` : ''}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <StatusBadge status={ag.status} passado={efetivamentePassado} />
        <span className={`text-xs font-medium whitespace-nowrap ${cancelado ? 'text-gray-500' : 'text-gray-600'}`}>
          {formatarDataHora(ag.data_hora)}
        </span>
      </div>
    </button>
  )
}

// ── ListaComCancelados ───────────────────────────────────────────────────────

function ListaComCancelados({
  agendamentos, vazio, mostrarCancelados, onToggleCancelados, onAbrir, limite,
}: {
  agendamentos: Agendamento[]
  vazio: string
  mostrarCancelados: boolean
  onToggleCancelados: () => void
  onAbrir: (ag: Agendamento) => void
  /** Corta a lista de ativos — a home mostra só os próximos, não tudo. */
  limite?: number
}) {
  const ativos     = agendamentos.filter(a => a.status !== 'cancelado')
  const cancelados = agendamentos.filter(a => a.status === 'cancelado')
  const visiveis   = limite ? ativos.slice(0, limite) : ativos

  if (agendamentos.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
        <p className="text-gray-500 text-sm">{vazio}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {ativos.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
          <p className="text-gray-500 text-sm">Nenhum agendamento ativo.</p>
        </div>
      )}
      {visiveis.map(ag => (
        <AgendamentoCard key={ag.id} ag={ag} onAbrir={onAbrir} />
      ))}

      {cancelados.length > 0 && (
        <>
          <button
            onClick={onToggleCancelados}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors pt-1 pl-1"
          >
            <ChevronDown
              size={14}
              className="transition-transform duration-200"
              style={{ transform: mostrarCancelados ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
            {mostrarCancelados
              ? 'Ocultar cancelados'
              : `Ver ${cancelados.length} cancelado${cancelados.length > 1 ? 's' : ''}`}
          </button>
          {mostrarCancelados && (
            <div className="space-y-3">
              {cancelados.map(ag => (
                <AgendamentoCard key={ag.id} ag={ag} onAbrir={onAbrir} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
