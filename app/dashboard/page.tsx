'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

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

function Badge({ status }: { status: string }) {
  const map: Record<string, { label: string; classes: string }> = {
    confirmado: { label: 'Confirmado', classes: 'bg-[#dcfce7] text-[#128C7E]' },
    cancelado:  { label: 'Cancelado',  classes: 'bg-red-50 text-red-500' },
    pendente:   { label: 'Pendente',   classes: 'bg-yellow-50 text-yellow-600' },
  }
  const s = map[status] ?? { label: status, classes: 'bg-gray-100 text-gray-500' }
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.classes}`}>
      {s.label}
    </span>
  )
}

export default function DashboardPage() {
  const [agendamentosHoje, setAgendamentosHoje] = useState(0)
  const [proximosAgendamentos, setProximosAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)
  const [selecionado, setSelecionado] = useState<Agendamento | null>(null)

  // Reagendar
  const [reagendando, setReagendando] = useState(false)
  const [novaData, setNovaData] = useState('')
  const [novoHorario, setNovoHorario] = useState('')
  const [salvando, setSalvando] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const hoje = new Date()
      const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString()
      const fimHoje   = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1).toISOString()

      const { count } = await supabase
        .from('agendamentos')
        .select('*', { count: 'exact', head: true })
        .gte('data_hora', inicioHoje)
        .lt('data_hora', fimHoje)

      setAgendamentosHoje(count ?? 0)

      const { data } = await supabase
        .from('agendamentos')
        .select('id, cliente_nome, cliente_telefone, servico, data_hora, status')
        .gte('data_hora', new Date().toISOString())
        .order('data_hora', { ascending: true })
        .limit(20)

      setProximosAgendamentos(data ?? [])
      setLoading(false)
    }
    init()
  }, [])

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
    setProximosAgendamentos(prev =>
      prev.map(a => a.id === id ? { ...a, ...campos } : a)
    )
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f9f9f9' }}>
        <p className="text-gray-500 text-sm">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f9f9f9' }}>
      <main className="max-w-2xl mx-auto px-6 py-14 space-y-10">

        {/* Título */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#0a0a0a' }}>Visão geral</h1>
          <p className="text-gray-500 mt-1 text-sm">Seus agendamentos de hoje e os próximos.</p>
        </div>

        {/* Card hoje */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex items-center gap-6">
          <div className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-[#dcfce7]">
            <span className="text-4xl font-bold text-[#128C7E] leading-none">{agendamentosHoje}</span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest font-medium mb-1 text-gray-500">Hoje</p>
            <p className="text-xl font-semibold" style={{ color: '#0a0a0a' }}>
              {agendamentosHoje === 1 ? '1 agendamento' : `${agendamentosHoje} agendamentos`}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>

        {/* Lista */}
        <div>
          <h2 className="text-xs uppercase tracking-widest font-medium mb-5 text-gray-500">Próximos agendamentos</h2>

          {proximosAgendamentos.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
              <p className="text-gray-500 text-sm">Nenhum agendamento futuro.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {proximosAgendamentos.map((ag) => {
                const cancelado = ag.status === 'cancelado'
                return (
                  <button
                    key={ag.id}
                    onClick={() => abrirModal(ag)}
                    className={`w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex items-center gap-5 transition-all duration-150 hover:shadow-md hover:border-gray-200 ${cancelado ? 'opacity-60' : ''}`}
                  >
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${cancelado ? 'bg-gray-100' : 'bg-[#dcfce7]'}`}>
                      <span className={`text-sm font-bold ${cancelado ? 'text-gray-500' : 'text-[#128C7E]'}`}>
                        {inicialAvatar(ag.cliente_nome)}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm truncate ${cancelado ? 'line-through text-gray-500' : ''}`} style={cancelado ? {} : { color: '#0a0a0a' }}>
                        {ag.cliente_nome}
                      </p>
                      <p className={`text-sm truncate ${cancelado ? 'text-gray-500' : 'text-gray-600'}`}>
                        {ag.servico}
                      </p>
                    </div>

                    {/* Direita: badge + horário */}
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <Badge status={ag.status} />
                      <span className={`text-xs font-medium ${cancelado ? 'text-gray-500' : 'text-gray-600'}`}>
                        {formatarDataHora(ag.data_hora)}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
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
            {/* Cabeçalho */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#dcfce7] flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-[#128C7E]">
                    {inicialAvatar(selecionado.cliente_nome)}
                  </span>
                </div>
                <div>
                  <p className="font-bold" style={{ color: '#0a0a0a' }}>{selecionado.cliente_nome}</p>
                  <Badge status={selecionado.status} />
                </div>
              </div>
              <button onClick={fecharModal} className="text-gray-500 hover:text-gray-700 transition-colors text-xl leading-none">
                ✕
              </button>
            </div>

            {/* Detalhes */}
            <div className="space-y-3 mb-6">
              <Row label="Telefone" value={selecionado.cliente_telefone} />
              <Row label="Serviço"  value={selecionado.servico} />
              <Row label="Data e horário" value={formatarDataHora(selecionado.data_hora)} />
            </div>

            {/* Formulário de reagendamento */}
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

            {/* Ações */}
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
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs uppercase tracking-widest font-medium text-gray-500">{label}</span>
      <span className="text-sm font-medium" style={{ color: '#0a0a0a' }}>{value}</span>
    </div>
  )
}
