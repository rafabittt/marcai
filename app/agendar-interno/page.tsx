'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { maskName, maskPhone } from '@/lib/masks'
import CalendarioInline from '@/app/components/CalendarioInline'
import SidebarLayout from '@/app/components/SidebarLayout'
import GooLoader from '@/app/components/GooLoader'
import {
  HORARIOS, horariosDoDia, horariosLivres as calcularLivres,
  type HorariosMap,
} from '@/lib/agenda'

// plano nao aparece aqui: o limite do plano e decidido no servidor, por
// /api/agendar, junto com expediente e conflito de horario.
type Negocio     = { id: string; nome: string; slug: string; horarios: HorariosMap | null }
type Servico     = { id: string; nome: string; duracao: string; profissional_id?: string }
type Profissional = { id: string; nome: string; cargo: string }

const selectClass = 'w-full border border-[#e5e7eb] rounded-2xl px-4 py-3 text-sm text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent'
const inputClass  = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#25D366] placeholder-gray-300'
const labelClass  = 'text-xs uppercase tracking-widest text-gray-500 font-medium mb-1.5 block'

export default function AgendarInternoPage() {
  const [negocio,       setNegocio]       = useState<Negocio | null>(null)
  const [servicos,      setServicos]      = useState<Servico[]>([])
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [loading,       setLoading]       = useState(true)
  const [submitting,    setSubmitting]    = useState(false)
  const [sucesso,       setSucesso]       = useState(false)
  const [erro,          setErro]          = useState('')

  const [nome,           setNome]          = useState('')
  const [telefone,       setTelefone]      = useState('')
  const [servicoId,      setServicoId]     = useState('')
  const [profissionalId, setProfissionalId] = useState('')
  const [data,           setData]          = useState('')
  const [horario,        setHorario]       = useState('')
  const [ocupados,       setOcupados]      = useState<string[]>([])

  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const { data: neg } = await supabase
        .from('negocios')
        .select('id, nome, slug, horarios')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!neg) { setLoading(false); return }
      setNegocio(neg)

      const [{ data: srvData }, { data: profData }] = await Promise.all([
        supabase.from('servicos').select('id, nome, duracao, profissional_id').eq('negocio_id', neg.id),
        supabase.from('profissionais').select('id, nome, cargo').eq('negocio_id', neg.id),
      ])

      setServicos(srvData ?? [])
      setProfissionais(profData ?? [])
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (!data || !negocio?.id) { setOcupados([]); return }
    const params = new URLSearchParams({ negocio_id: negocio.id, data })
    if (profissionalId) params.set('profissional_id', profissionalId)
    fetch(`/api/agendar/ocupados?${params}`)
      .then(r => r.json())
      .then(({ ocupados: slots }) => setOcupados(slots ?? []))
      .catch(() => setOcupados([]))
  }, [data, negocio?.id, profissionalId])

  const horariosDisponiveis = useMemo<string[] | null>(() => {
    if (!data) return null
    return horariosDoDia(negocio?.horarios, data)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, JSON.stringify(negocio?.horarios)])

  const horariosLivres = useMemo(() => {
    if (!horariosDisponiveis) return null
    return calcularLivres(horariosDisponiveis, ocupados, data)
  }, [horariosDisponiveis, ocupados, data])

  const diaFechado = horariosDisponiveis !== null && horariosDisponiveis.length === 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!negocio) return

    setSubmitting(true)
    setErro('')

    // Mesma rota da pagina publica, de proposito.
    //
    // Antes esta tela fazia INSERT direto no supabase do browser, pulando
    // /api/agendar. Com isso o caminho do dono — o mais usado — nao tinha
    // nenhuma das validacoes de servidor: gravava em horario ja ocupado
    // (sem 409), gravava fora do expediente, pausa ou folga (sem 422), e
    // notificava so o cliente, deixando o dono sem aviso do proprio
    // agendamento. O limite de plano era reimplementado aqui, em duplicidade
    // com a rota.
    //
    // Nada de logica de agendamento vive mais nesta tela: ela so coleta os
    // campos e delega. Se um dia o dono precisar de encaixe fora da grade,
    // isso entra como um override explicito no servidor — nunca voltando a
    // pular a validacao.
    try {
      const res = await fetch('/api/agendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: negocio.slug,
          nome,
          telefone,
          servicoId,
          profissionalId,
          data,
          horario,
        }),
      })

      if (res.status === 403) {
        setErro('Limite de 5 agendamentos/mês do plano Freemium atingido. Faça upgrade para continuar.')
        return
      }

      if (res.status === 422) {
        setErro('Este horário está fora da agenda configurada (expediente, pausa ou folga). Escolha outro.')
        setHorario('')
        return
      }

      if (res.status === 409) {
        setErro('Este horário já está ocupado. Escolha outro.')
        setHorario('')
        return
      }

      if (!res.ok) {
        setErro('Erro ao realizar agendamento. Tente novamente.')
        return
      }

      setSucesso(true)
    } catch {
      setErro('Erro ao realizar agendamento. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setSucesso(false)
    setNome('')
    setTelefone('')
    setServicoId('')
    setProfissionalId('')
    setData('')
    setHorario('')
  }

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <GooLoader />
        </div>
      </SidebarLayout>
    )
  }

  if (sucesso) {
    return (
      <SidebarLayout>
        <div className="py-14 px-6 flex items-start justify-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-10 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-[#dcfce7]">
              <svg className="w-8 h-8 text-[#25D366]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Agendamento confirmado!</h2>
            <p className="text-gray-500 text-sm mb-6">
              <span className="font-medium text-gray-700">{nome}</span> foi agendado com sucesso.
            </p>
            <div className="flex gap-3">
              <button
                onClick={resetForm}
                className="flex-1 py-3 rounded-xl text-sm font-semibold border-2 border-[#25D366] text-[#25D366] hover:bg-[#dcfce7] transition-colors"
              >
                Novo agendamento
              </button>
              <a
                href="/dashboard"
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-[#25D366] hover:bg-[#128C7E] text-center transition-colors"
              >
                Ver agenda
              </a>
            </div>
          </div>
        </div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout>
      <div className="py-14 px-6">
        <div className="max-w-md mx-auto">

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Novo agendamento</h1>
            <p className="text-gray-500 mt-1 text-sm">
              {negocio?.nome} — registre um agendamento manualmente.
            </p>
          </div>

          {erro && (
            <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl mb-6">{erro}</div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={labelClass}>Nome do cliente</label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(maskName(e.target.value))}
                  required
                  placeholder="João Silva"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Telefone / WhatsApp</label>
                <input
                  type="tel"
                  value={telefone}
                  onChange={e => setTelefone(maskPhone(e.target.value))}
                  required
                  placeholder="(11) 99999-9999"
                  className={inputClass}
                />
              </div>

              {profissionais.length > 0 && (
                <div>
                  <label className={labelClass}>Profissional</label>
                  <select
                    value={profissionalId}
                    onChange={e => { setProfissionalId(e.target.value); setServicoId('') }}
                    required
                    className={selectClass}
                  >
                    <option value="">Selecione um profissional</option>
                    {profissionais.map(p => (
                      <option key={p.id} value={String(p.id)}>
                        {p.nome}{p.cargo ? ` — ${p.cargo}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className={labelClass}>Serviço</label>
                {(() => {
                  const servicosFiltrados = profissionalId
                    ? servicos.filter(s => s.profissional_id === profissionalId)
                    : servicos
                  return servicosFiltrados.length > 0 ? (
                    <select
                      value={servicoId}
                      onChange={e => setServicoId(e.target.value)}
                      required
                      className={selectClass}
                    >
                      <option value="">Selecione um serviço</option>
                      {servicosFiltrados.map(s => (
                        <option key={s.id} value={String(s.id)}>
                          {s.nome} ({s.duracao})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={servicoId}
                      onChange={e => setServicoId(e.target.value)}
                      required
                      placeholder="Ex: Corte de cabelo"
                      className={inputClass}
                    />
                  )
                })()}
              </div>

              <div>
                <label className={labelClass}>Data</label>
                <CalendarioInline
                  value={data}
                  onChange={v => { setData(v); setHorario('') }}
                  horarios={negocio?.horarios}
                />
              </div>

              <div>
                <label className={labelClass}>Horário</label>
                <select
                  value={horario}
                  onChange={e => setHorario(e.target.value)}
                  required={!diaFechado}
                  disabled={!data || diaFechado}
                  className={`${selectClass} disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed`}
                >
                  {!data && <option value="">Selecione uma data primeiro</option>}
                  {data && diaFechado && <option value="">Fechado neste dia</option>}
                  {data && !diaFechado && (
                    <>
                      <option value="">Selecione um horário</option>
                      {(horariosLivres ?? HORARIOS).map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-[#25D366] transition-all duration-200 hover:bg-[#128C7E] hover:scale-[1.02] disabled:opacity-50"
                >
                  {submitting ? 'Agendando...' : 'Confirmar agendamento'}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </SidebarLayout>
  )
}
