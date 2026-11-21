'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { CalendarClock, CalendarCheck, Clock3, ChevronDown } from 'lucide-react'
import SidebarLayout from '@/app/components/SidebarLayout'
import Carregando from '@/app/components/Carregando'
import {
  localDateStr, naiveNowISO, horaDe, dataDe, montarDataHora,
  horariosDoDia, horariosLivres, type HorariosMap,
} from '@/lib/agenda'
import StatusBadge from '@/app/components/StatusBadge'
import MetricCard from '@/app/components/MetricCard'
import InfoRow from '@/app/components/InfoRow'
import PainelLateral from '@/app/components/PainelLateral'
import GraficoVolume from '@/app/components/GraficoVolume'
import Abas from '@/app/components/Abas'

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
        <Carregando />
      </SidebarLayout>
    )
  }

  const isPassado = selecionado ? selecionado.data_hora < agora : false
  const ocupadosHoje = totalGradeHoje > 0 && vagosHoje !== null ? totalGradeHoje - vagosHoje : 0
  const proximosAtivos = proximos.filter(a => a.status !== 'cancelado').length

  return (
    <SidebarLayout>
      <main className="page">

        {/* ── Cabeçalho: o título diz o que a tela responde ── */}
        <div className="page-head">
          <div className="min-w-0">
            <h1 className="t-title">
              {saudacao()}{nomeNegocio ? `, ${nomeNegocio}` : ''}
            </h1>
            <p className="t-sub first-letter:uppercase">{dataExtenso()}</p>
          </div>
          <span className="flex-1" />
          <Abas
            rotulo="Ver"
            valor={aba}
            onChange={setAba}
            opcoes={[['agenda', 'Agenda'], ['historico', 'Histórico']] as const}
          />
        </div>

        {aba === 'agenda' ? (
          <div className="space-y-[14px]">
            {/* ── Resumo do dia ── */}
            <section aria-label="Resumo do dia" className="grid grid-cols-2 sm:grid-cols-3 gap-[14px]">
              <MetricCard
                destaque
                className="col-span-2 sm:col-span-1"
                label="Próximo cliente"
                icon={<CalendarClock size={15} strokeWidth={1.8} />}
                value={proximoCliente ? horaDe(proximoCliente.data_hora) : '—'}
                apagado={!proximoCliente}
                rodape={proximoCliente ? proximoCliente.cliente_nome : 'Nada mais para hoje'}
              />
              <MetricCard
                label="Hoje"
                icon={<CalendarCheck size={15} strokeWidth={1.8} />}
                value={ativosHoje.length}
                unidade={ativosHoje.length === 1 ? 'agendamento' : 'agendamentos'}
                rodape={ativosHoje.length === 0 ? 'Agenda livre' : 'sem contar os cancelados'}
              />
              <MetricCard
                label="Horários vagos"
                icon={<Clock3 size={15} strokeWidth={1.8} />}
                value={vagosHoje ?? '—'}
                unidade={totalGradeHoje > 0 ? `de ${totalGradeHoje}` : undefined}
                rodape={totalGradeHoje === 0 ? 'Fechado hoje' : 'na grade de hoje'}
                progress={totalGradeHoje > 0 ? Math.round((ocupadosHoje / totalGradeHoje) * 100) : undefined}
              />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[14px] items-start">
              <section className="card">
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <h2 className="t-section">Hoje</h2>
                  <span className="t-cap first-letter:uppercase">
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

              <section className="card">
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <h2 className="t-section">Próximos</h2>
                  {proximosAtivos > PROXIMOS_NA_HOME && (
                    <span className="t-cap">os {PROXIMOS_NA_HOME} mais próximos</span>
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
            </div>
          </div>
        ) : (
          <div className="space-y-[14px]">
            {/* Abre a aba: dá a leitura do período antes do item a item.
                Faz a própria consulta por período — antes montava em cima da
                lista paginada, então mostrava só o que já tinha sido carregado
                por "Ver mais". */}
            <GraficoVolume negocioId={negocioId} />

            <section className="card">
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <h2 className="t-section">Histórico</h2>
                {passados.length > 0 && (
                  <span className="t-cap tabular">
                    {passados.length} {passados.length === 1 ? 'carregado' : 'carregados'}
                  </span>
                )}
              </div>
              {passados.length === 0 ? (
                <p className="t-cap py-6 text-center">Nenhum agendamento realizado ainda.</p>
              ) : (
                <>
                  <div className="list">
                    {passados.map(ag => (
                      <LinhaAgendamento key={ag.id} ag={ag} onAbrir={abrirPainel} passado />
                    ))}
                  </div>
                  {temMaisPassados && (
                    <button
                      onClick={carregarMaisPassados}
                      disabled={carregandoMais}
                      className="btn btn-block mt-3"
                    >
                      {carregandoMais ? 'Carregando…' : `Ver mais ${POR_PAGINA}`}
                    </button>
                  )}
                </>
              )}
            </section>
          </div>
        )}
      </main>

      {/* ── Painel lateral de detalhe ── */}
      <PainelLateral
        aberto={selecionado !== null}
        onFechar={fecharPainel}
        titulo={selecionado && (
          <div className="flex items-center gap-3">
            <div className="avatar !w-11 !h-11 !text-base">
              {inicialAvatar(selecionado.cliente_nome)}
            </div>
            <div className="min-w-0">
              <p className="t-section truncate mb-1">{selecionado.cliente_nome}</p>
              <StatusBadge status={selecionado.status} passado={isPassado} />
            </div>
          </div>
        )}
        rodape={selecionado && selecionado.status !== 'cancelado' && !isPassado ? (
          <div className="flex gap-3">
            <button onClick={cancelar} disabled={salvando} className="btn btn-danger btn-lg flex-1">
              Cancelar horário
            </button>
            <button
              onClick={() => setReagendando(p => !p)}
              aria-expanded={reagendando}
              className="btn btn-primary btn-lg flex-1"
            >
              Reagendar
            </button>
          </div>
        ) : undefined}
      >
        {selecionado && (
          <>
            <div>
              <InfoRow label="Telefone"       value={selecionado.cliente_telefone} />
              <InfoRow label="Serviço"        value={selecionado.servico} />
              {selecionado.profissional && <InfoRow label="Profissional" value={selecionado.profissional} />}
              <InfoRow label="Data e horário" value={formatarDataHora(selecionado.data_hora)} />
            </div>

            {reagendando && !isPassado && (
              <div className="rounded-[16px] bg-fill p-4 mt-5 space-y-3">
                <p className="t-label">Nova data e horário</p>
                <div className="flex gap-3">
                  <input
                    type="date"
                    value={novaData}
                    onChange={e => setNovaData(e.target.value)}
                    aria-label="Nova data"
                    className="field flex-1 min-w-0"
                  />
                  <input
                    type="time"
                    value={novoHorario}
                    onChange={e => setNovoHorario(e.target.value)}
                    aria-label="Novo horário"
                    className="field flex-1 min-w-0"
                  />
                </div>
                <button onClick={reagendar} disabled={salvando} className="btn btn-primary btn-block">
                  {salvando ? 'Salvando…' : 'Confirmar reagendamento'}
                </button>
              </div>
            )}
          </>
        )}
      </PainelLateral>
    </SidebarLayout>
  )
}

// ── LinhaAgendamento ─────────────────────────────────────────────────────────
// Lista do Grafite: linha com separador fino, sem caixa por linha. A linha
// inteira abre o painel.

function LinhaAgendamento({
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
      className="list-row w-full text-left -mx-2 px-2 rounded-[10px] hover:bg-fill transition-colors duration-150"
      style={{ width: 'calc(100% + 16px)' }}
    >
      <div className={`avatar ${cancelado ? 'opacity-50' : ''}`}>
        {inicialAvatar(ag.cliente_nome)}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[15px] font-medium truncate ${cancelado ? 'line-through text-muted' : 'text-fg'}`}>
          {ag.cliente_nome}
        </p>
        <p className="t-cap truncate">
          {ag.servico}{ag.profissional ? ` · ${ag.profissional}` : ''}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className={`text-[13px] font-semibold tabular whitespace-nowrap ${cancelado ? 'text-muted' : 'text-fg'}`}>
          {formatarDataHora(ag.data_hora)}
        </span>
        <StatusBadge status={ag.status} passado={efetivamentePassado} />
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
    return <p className="t-cap py-6 text-center">{vazio}</p>
  }

  return (
    <div>
      {ativos.length === 0 && (
        <p className="t-cap py-4 text-center">Nenhum agendamento ativo.</p>
      )}
      <div className="list">
        {visiveis.map(ag => (
          <LinhaAgendamento key={ag.id} ag={ag} onAbrir={onAbrir} />
        ))}
      </div>

      {cancelados.length > 0 && (
        <>
          <button
            onClick={onToggleCancelados}
            aria-expanded={mostrarCancelados}
            className="btn btn-ghost btn-sm -ml-3 mt-1"
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
            <div className="list border-t border-hairline">
              {cancelados.map(ag => (
                <LinhaAgendamento key={ag.id} ag={ag} onAbrir={onAbrir} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
