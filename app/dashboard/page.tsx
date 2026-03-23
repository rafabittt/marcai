'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  BarChart2, CheckCircle, XCircle, ChevronDown, X,
} from 'lucide-react'
import SidebarLayout from '@/app/components/SidebarLayout'

type Agendamento = {
  id: string
  cliente_nome: string
  cliente_telefone: string
  servico: string
  data_hora: string
  status: string
}

function inicialAvatar(nome: string) {
  return nome.trim().charAt(0).toUpperCase()
}

function formatarDataHora(iso: string) {
  const d = new Date(iso)
  const hoje = new Date()
  const amanha = new Date(hoje)
  amanha.setDate(hoje.getDate() + 1)

  const mesmaData = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()

  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  if (mesmaData(d, hoje)) return `Hoje, ${hora}`
  if (mesmaData(d, amanha)) return `Amanhã, ${hora}`

  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + `, ${hora}`
}

function toInputDate(iso: string) {
  return iso.slice(0, 10)
}

function toInputTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function saudacao(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function dataExtenso(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function Badge({ status, passado = false }: { status: string; passado?: boolean }) {
  const resolvedStatus = passado && status === 'confirmado' ? 'concluido' : status
  const map: Record<string, { label: string; classes: string }> = {
    confirmado: { label: 'Confirmado', classes: 'bg-[#dcfce7] text-[#128C7E]' },
    cancelado:  { label: 'Cancelado',  classes: 'bg-red-50 text-red-500' },
    pendente:   { label: 'Pendente',   classes: 'bg-yellow-50 text-yellow-600' },
    concluido:  { label: 'Realizado',  classes: 'bg-gray-100 text-gray-500' },
  }
  const s = map[resolvedStatus] ?? { label: resolvedStatus, classes: 'bg-gray-100 text-gray-500' }
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.classes}`}>
      {s.label}
    </span>
  )
}

export default function DashboardPage() {
  const [nomeNegocio,           setNomeNegocio]           = useState<string | null>(null)
  const [agendamentosHoje,      setAgendamentosHoje]      = useState<Agendamento[]>([])
  const [proximosAgendamentos,  setProximosAgendamentos]  = useState<Agendamento[]>([])
  const [agendamentosPassados,  setAgendamentosPassados]  = useState<Agendamento[]>([])
  const [loading,               setLoading]               = useState(true)
  const [selecionado,           setSelecionado]           = useState<Agendamento | null>(null)
  const [mostrarCanceladosHoje,      setMostrarCanceladosHoje]      = useState(false)
  const [mostrarCanceladosProximos,  setMostrarCanceladosProximos]  = useState(false)
  const [mostrarCanceladosPassados,  setMostrarCanceladosPassados]  = useState(false)

  const [reagendando,  setReagendando]  = useState(false)
  const [novaData,     setNovaData]     = useState('')
  const [novoHorario,  setNovoHorario]  = useState('')
  const [salvando,     setSalvando]     = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const { data: neg } = await supabase
        .from('negocios')
        .select('nome')
        .eq('user_id', user.id)
        .maybeSingle()
      setNomeNegocio(neg?.nome ?? null)

      const hoje = new Date()
      const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString()
      const fimHoje   = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1).toISOString()

      const { data: dataHoje } = await supabase
        .from('agendamentos')
        .select('id, cliente_nome, cliente_telefone, servico, data_hora, status')
        .gte('data_hora', inicioHoje)
        .lt('data_hora', fimHoje)
        .order('data_hora', { ascending: true })

      setAgendamentosHoje(dataHoje ?? [])

      const { data } = await supabase
        .from('agendamentos')
        .select('id, cliente_nome, cliente_telefone, servico, data_hora, status')
        .gte('data_hora', new Date().toISOString())
        .order('data_hora', { ascending: true })
        .limit(20)

      setProximosAgendamentos(data ?? [])

      const { data: dataPassados } = await supabase
        .from('agendamentos')
        .select('id, cliente_nome, cliente_telefone, servico, data_hora, status')
        .lt('data_hora', inicioHoje)
        .order('data_hora', { ascending: false })
        .limit(30)

      setAgendamentosPassados(dataPassados ?? [])
      setLoading(false)
    }
    init()
  }, [])

  const todosUnicos = useMemo(() => {
    const map = new Map<string, Agendamento>()
    ;[...agendamentosPassados, ...agendamentosHoje, ...proximosAgendamentos]
      .forEach(a => map.set(a.id, a))
    return [...map.values()]
  }, [agendamentosPassados, agendamentosHoje, proximosAgendamentos])

  const totalCount      = todosUnicos.length
  const concluidosCount = agendamentosPassados.filter(a => a.status !== 'cancelado').length
  const canceladosCount = todosUnicos.filter(a => a.status === 'cancelado').length

  const chartData = useMemo(() => {
    const byDay: Record<string, { Realizados: number; Cancelados: number }> = {}
    agendamentosPassados.forEach(ag => {
      const day = ag.data_hora.slice(0, 10)
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
  }, [agendamentosPassados])

  function abrirModal(ag: Agendamento) {
    setSelecionado(ag)
    setReagendando(false)
    setNovaData(toInputDate(ag.data_hora))
    setNovoHorario(toInputTime(ag.data_hora))
  }

  function fecharModal() {
    setSelecionado(null)
    setReagendando(false)
    setSalvando(false)
  }

  function atualizarLista(id: string, campos: Partial<Agendamento>) {
    setAgendamentosHoje(prev => prev.map(a => a.id === id ? { ...a, ...campos } : a))
    setProximosAgendamentos(prev => prev.map(a => a.id === id ? { ...a, ...campos } : a))
    setAgendamentosPassados(prev => prev.map(a => a.id === id ? { ...a, ...campos } : a))
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
    const novaDataHora = new Date(`${novaData}T${novoHorario}`).toISOString()
    await supabase.from('agendamentos').update({ data_hora: novaDataHora, status: 'confirmado' }).eq('id', selecionado.id)
    atualizarLista(selecionado.id, { data_hora: novaDataHora, status: 'confirmado' })
    setSelecionado(prev => prev ? { ...prev, data_hora: novaDataHora, status: 'confirmado' } : prev)
    setReagendando(false)
    setSalvando(false)
  }

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 text-sm">Carregando...</p>
        </div>
      </SidebarLayout>
    )
  }

  const isPassado = selecionado ? agendamentosPassados.some(a => a.id === selecionado.id) : false
  const pct = (n: number) => totalCount === 0 ? 0 : Math.round((n / totalCount) * 100)

  return (
    <SidebarLayout>
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-10">

        {/* ── Greeting ── */}
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-1">
            {dataExtenso()}
          </p>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#0a0a0a' }}>
            {saudacao()}{nomeNegocio ? `, ${nomeNegocio}!` : '!'}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Aqui está o resumo dos seus agendamentos.</p>
        </div>

        {/* ── Cards de métricas + Próximo agendamento ── */}
        <div>
          <h2 className="text-xs uppercase tracking-widest font-medium mb-5 text-gray-500">Desempenho</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Total */}
            <MetricCard
              label="TOTAL"
              value={totalCount}
              valueColor="text-gray-900"
              iconBg="bg-gray-100"
              icon={<BarChart2 size={18} className="text-gray-500" />}
              progress={100}
              progressColor="bg-gray-300"
            />
            {/* Concluídos */}
            <MetricCard
              label="CONCLUÍDOS"
              value={concluidosCount}
              valueColor="text-[#25D366]"
              iconBg="bg-[#dcfce7]"
              icon={<CheckCircle size={18} className="text-[#25D366]" />}
              progress={pct(concluidosCount)}
              progressColor="bg-[#25D366]"
            />
            {/* Cancelados */}
            <MetricCard
              label="CANCELADOS"
              value={canceladosCount}
              valueColor="text-red-500"
              iconBg="bg-red-50"
              icon={<XCircle size={18} className="text-red-400" />}
              progress={pct(canceladosCount)}
              progressColor="bg-red-400"
            />
          </div>

          {/* Gráfico */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 pt-6 pb-4">
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
                  <XAxis
                    dataKey="dia"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    width={24}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #f0f0f0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      fontSize: '12px',
                    }}
                    cursor={{ fill: '#f9f9f9' }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
                  />
                  <Bar dataKey="Realizados" fill="#25D366" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Cancelados" fill="#fca5a5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Hoje ── */}
        <div>
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
            onAbrirModal={abrirModal}
          />
        </div>

        {/* ── Próximos ── */}
        <div>
          <h2 className="text-xs uppercase tracking-widest font-medium mb-5 text-gray-500">Próximos agendamentos</h2>
          <ListaComCancelados
            agendamentos={proximosAgendamentos}
            vazio="Nenhum agendamento futuro."
            mostrarCancelados={mostrarCanceladosProximos}
            onToggleCancelados={() => setMostrarCanceladosProximos(p => !p)}
            onAbrirModal={abrirModal}
          />
        </div>

        {/* ── Histórico ── */}
        <div>
          <h2 className="text-xs uppercase tracking-widest font-medium mb-5 text-gray-500">Histórico</h2>
          <ListaComCancelados
            agendamentos={agendamentosPassados}
            vazio="Nenhum agendamento realizado."
            mostrarCancelados={mostrarCanceladosPassados}
            onToggleCancelados={() => setMostrarCanceladosPassados(p => !p)}
            onAbrirModal={abrirModal}
            passado
          />
        </div>

      </main>

      {/* ── MODAL ── */}
      {selecionado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          onClick={fecharModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#dcfce7] flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-[#128C7E]">
                    {inicialAvatar(selecionado.cliente_nome)}
                  </span>
                </div>
                <div>
                  <p className="font-bold" style={{ color: '#0a0a0a' }}>{selecionado.cliente_nome}</p>
                  <Badge status={selecionado.status} passado={isPassado} />
                </div>
              </div>
              <button
                onClick={fecharModal}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <Row label="Telefone"      value={selecionado.cliente_telefone} />
              <Row label="Serviço"       value={selecionado.servico} />
              <Row label="Data e horário" value={formatarDataHora(selecionado.data_hora)} />
            </div>

            {reagendando && (
              <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-3">
                <p className="text-xs uppercase tracking-widest font-medium text-gray-500">Nova data e horário</p>
                <div className="flex gap-3">
                  <input
                    type="date"
                    value={novaData}
                    onChange={e => setNovaData(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                  />
                  <input
                    type="time"
                    value={novoHorario}
                    onChange={e => setNovoHorario(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
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

            {selecionado.status !== 'cancelado' && (
              <div className="flex gap-3">
                <button
                  onClick={cancelar}
                  disabled={salvando}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-red-500 border-2 border-red-100 transition-all duration-200 hover:bg-red-50 hover:border-red-200 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setReagendando(prev => !prev)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-[#25D366] transition-all duration-200 hover:bg-[#128C7E]"
                >
                  Reagendar
                </button>
              </div>
            )}

            <button
              onClick={fecharModal}
              className="mt-3 w-full py-3 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </SidebarLayout>
  )
}

// ── MetricCard ───────────────────────────────────────────────────────────────

function MetricCard({
  label, value, valueColor, iconBg, icon, progress, progressColor,
}: {
  label: string
  value: number
  valueColor: string
  iconBg: string
  icon: React.ReactNode
  progress: number
  progressColor: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 pt-5 pb-4 flex flex-col relative overflow-hidden">
      <div className="flex items-start justify-between mb-3">
        <span className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">{label}</span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>
      <span className={`text-5xl font-bold tracking-tight leading-none mb-4 ${valueColor}`}>{value}</span>
      {/* Barra de progresso */}
      <div className="h-1 w-full bg-gray-100 rounded-full mt-auto">
        <div
          className={`h-1 rounded-full transition-all duration-500 ${progressColor}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
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
  return (
    <button
      onClick={() => onAbrir(ag)}
      className={`w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex items-center gap-5 transition-all duration-150 hover:shadow-md hover:border-gray-200 ${cancelado ? 'opacity-60' : ''}`}
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
          {ag.servico}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <Badge status={ag.status} passado={passado} />
        <span className={`text-xs font-medium ${cancelado ? 'text-gray-500' : 'text-gray-600'}`}>
          {formatarDataHora(ag.data_hora)}
        </span>
      </div>
    </button>
  )
}

// ── ListaComCancelados ───────────────────────────────────────────────────────

function ListaComCancelados({
  agendamentos, vazio, mostrarCancelados, onToggleCancelados, onAbrirModal, passado = false,
}: {
  agendamentos: Agendamento[]
  vazio: string
  mostrarCancelados: boolean
  onToggleCancelados: () => void
  onAbrirModal: (ag: Agendamento) => void
  passado?: boolean
}) {
  const ativos     = agendamentos.filter(a => a.status !== 'cancelado')
  const cancelados = agendamentos.filter(a => a.status === 'cancelado')

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
          <p className="text-gray-500 text-sm">{passado ? 'Nenhum agendamento realizado.' : 'Nenhum agendamento ativo.'}</p>
        </div>
      )}
      {ativos.map(ag => (
        <AgendamentoCard key={ag.id} ag={ag} onAbrir={onAbrirModal} passado={passado} />
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
                <AgendamentoCard key={ag.id} ag={ag} onAbrir={onAbrirModal} passado={passado} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Row ──────────────────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs uppercase tracking-widest font-medium text-gray-500">{label}</span>
      <span className="text-sm font-medium" style={{ color: '#0a0a0a' }}>{value}</span>
    </div>
  )
}
