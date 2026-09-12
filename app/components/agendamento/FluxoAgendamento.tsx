'use client'

import { useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import { maskName, maskPhone } from '@/lib/masks'
import CalendarioInline from '@/app/components/CalendarioInline'
import { type HorariosMap } from '@/lib/agenda'
import { useDisponibilidade } from './useDisponibilidade'
import SeletorHorario from './SeletorHorario'
import CardsServico, { type Servico } from './CardsServico'
import ResumoAgendamento from './ResumoAgendamento'

// ─────────────────────────────────────────────────────────────────────────────
// Fluxo de agendamento em passos, compartilhado pela página pública
// (/agendar/[slug]) e pela interna (/agendar-interno).
//
// Existe para acabar com as ~180 linhas que as duas telas duplicavam: o fetch
// de ocupados, os memos de disponibilidade, o filtro de serviço por
// profissional e os três seletores.
//
// O componente NÃO conhece /api/agendar: ele coleta os campos e chama
// onSubmit. Quem posta é cada página, porque os payloads diferem (a pública
// manda accessToken do cliente logado).
// ─────────────────────────────────────────────────────────────────────────────

export type Profissional = { id: string; nome: string; cargo: string }

export type DadosAgendamento = {
  nome: string
  telefone: string
  servicoId: string
  profissionalId: string
  data: string
  horario: string
}

type Props = {
  negocioId: string
  horarios: HorariosMap | null | undefined
  servicos: Servico[]
  profissionais: Profissional[]
  nomeInicial?: string
  telefoneInicial?: string
  rotuloNome?: string
  textoBotao?: string
  erro?: string
  submitting?: boolean
  onSubmit: (dados: DadosAgendamento) => void
}

const inputClass = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#25D366] placeholder-gray-300'

function Passo({
  numero, titulo, ativo, children,
}: {
  numero: number; titulo: string; ativo: boolean; children: React.ReactNode
}) {
  return (
    <section className={ativo ? '' : 'opacity-45 pointer-events-none select-none'}>
      <div className="flex items-center gap-2.5 mb-4">
        <span className="w-6 h-6 rounded-full bg-[#dcfce7] text-[#128C7E] text-xs font-bold flex items-center justify-center flex-shrink-0">
          {numero}
        </span>
        <h3 className="text-sm font-semibold text-[#0a0a0a]">{titulo}</h3>
      </div>
      {children}
    </section>
  )
}

export default function FluxoAgendamento({
  negocioId, horarios, servicos, profissionais,
  nomeInicial = '', telefoneInicial = '',
  rotuloNome = 'Seu nome', textoBotao = 'Confirmar agendamento',
  erro, submitting = false, onSubmit,
}: Props) {
  const [nome,           setNome]           = useState(nomeInicial)
  const [telefone,       setTelefone]       = useState(telefoneInicial)
  const [servicoId,      setServicoId]      = useState('')
  const [profissionalId, setProfissionalId] = useState('')
  const [data,           setData]           = useState('')
  const [horario,        setHorario]        = useState('')

  const servicoSel = useMemo(
    () => servicos.find(s => String(s.id) === servicoId) ?? null,
    [servicos, servicoId],
  )

  // Sem catálogo cadastrado, o serviço é texto livre e qualquer profissional
  // da casa pode atender.
  const semCatalogo = servicos.length === 0

  // Negócio sem equipe cadastrada não tem quem escolher — o passo some e o
  // agendamento vai sem profissional, como sempre foi. É diferente de "sem
  // preferência", que é escolha do cliente e ainda não existe.
  const temEquipe = profissionais.length > 0

  // Só entram no catálogo os serviços que alguém executa. Serviço sem ninguém
  // atribuído levaria a um beco sem saída no passo seguinte; o dono é avisado
  // disso em /servicos.
  const servicosAgendaveis = useMemo(
    () => semCatalogo ? servicos : servicos.filter(s => (s.profissionais_ids?.length ?? 0) > 0),
    [servicos, semCatalogo],
  )

  // Quem faz o serviço escolhido, pela junção servico_profissional. A coluna
  // legada servicos.profissional_id não é mais lida aqui.
  const profissionaisDoServico = useMemo(() => {
    if (!temEquipe) return []
    if (semCatalogo) return profissionais
    if (!servicoSel) return []
    const ids = servicoSel.profissionais_ids ?? []
    return profissionais.filter(p => ids.includes(String(p.id)))
  }, [temEquipe, semCatalogo, servicoSel, profissionais])

  const profissionalSel =
    profissionais.find(p => String(p.id) === profissionalId) ?? null

  const { livres, diaFechado, lotado, carregando } =
    useDisponibilidade(negocioId, horarios, data, profissionalId)

  function trocarServico(id: string) {
    setServicoId(id)
    // A disponibilidade é por profissional, e trocar de serviço troca a lista
    // de quem atende — o que já estava escolhido deixa de valer.
    setHorario('')

    const srv = servicos.find(s => String(s.id) === id)
    const ids = srv?.profissionais_ids ?? []
    const candidatos = semCatalogo
      ? profissionais
      : profissionais.filter(p => ids.includes(String(p.id)))

    // Um único profissional possível não é uma escolha: já vem marcado.
    setProfissionalId(candidatos.length === 1 ? String(candidatos[0].id) : '')
  }

  const passoServicoOk = servicoId !== ''
  const passoProfOk    = !temEquipe || profissionalId !== ''
  const passoDataOk    = data !== ''
  const passoHoraOk    = horario !== ''
  const podeEnviar     = passoServicoOk && passoProfOk && passoDataOk && passoHoraOk
    && nome.trim() !== '' && telefone.trim() !== ''

  // temEquipe não muda durante a sessão, então o total de passos é estável —
  // o contador não pula no meio do fluxo.
  const totalPassos = temEquipe ? 5 : 4
  const feitos = [passoServicoOk, temEquipe ? passoProfOk : null, passoDataOk, passoHoraOk]
    .filter(v => v === true).length
  const progresso = Math.round((feitos / totalPassos) * 100)

  let n = 0
  const nServico = ++n
  const nProf    = temEquipe ? ++n : 0
  const nData    = ++n
  const nHora    = ++n
  const nDados   = ++n

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({ nome, telefone, servicoId, profissionalId, data, horario })
  }

  return (
    <form onSubmit={handleSubmit} className="lg:grid lg:grid-cols-[1fr_20rem] lg:gap-10 lg:items-start">

      <div className="space-y-10">
        {/* Progresso — leve, só para dar noção de avanço */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">
              {feitos} de {totalPassos} escolhas feitas
            </span>
            <span className="text-xs text-gray-400">{progresso}%</span>
          </div>
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#25D366] rounded-full transition-all duration-500"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>

        {erro && (
          <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl">{erro}</div>
        )}

        <Passo numero={nServico} titulo="Escolha o serviço" ativo>
          {servicos.length > 0 && servicosAgendaveis.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-10 text-center">
              <p className="text-sm text-gray-500">
                Nenhum serviço disponível para agendamento no momento.
              </p>
            </div>
          ) : (
            <CardsServico
              servicos={servicosAgendaveis}
              valor={servicoId}
              onChange={trocarServico}
              inputClass={inputClass}
            />
          )}
        </Passo>

        {temEquipe && (
          <Passo numero={nProf} titulo="Escolha o profissional" ativo={passoServicoOk}>
            {profissionaisDoServico.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-10 text-center">
                <p className="text-sm text-gray-500">
                  {passoServicoOk
                    ? 'Nenhum profissional faz este serviço.'
                    : 'Escolha um serviço para ver quem atende.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {profissionaisDoServico.map(p => {
                  const selecionado = profissionalId === String(p.id)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setProfissionalId(String(p.id)); setHorario('') }}
                      aria-pressed={selecionado}
                      className={[
                        'w-full text-left rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all duration-150',
                        selecionado
                          ? 'bg-[#dcfce7] border-2 border-[#25D366]'
                          : 'bg-white border-2 border-gray-100 hover:border-gray-200',
                      ].join(' ')}
                    >
                      <div className="w-9 h-9 rounded-full bg-[#dcfce7] flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-[#128C7E]">
                          {p.nome.trim().charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#0a0a0a] truncate">{p.nome}</p>
                        {p.cargo && <p className="text-xs text-gray-500 truncate">{p.cargo}</p>}
                      </div>
                      {selecionado && (
                        <Check size={16} className="text-[#25D366] flex-shrink-0" strokeWidth={3} />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </Passo>
        )}

        <Passo numero={nData} titulo="Escolha a data" ativo={passoServicoOk && passoProfOk}>
          <CalendarioInline
            value={data}
            onChange={v => { setData(v); setHorario('') }}
            horarios={horarios}
          />
        </Passo>

        <Passo numero={nHora} titulo="Escolha o horário" ativo={passoDataOk}>
          <SeletorHorario
            horarios={livres}
            valor={horario}
            onChange={setHorario}
            diaFechado={diaFechado}
            lotado={lotado}
            carregando={carregando}
          />
        </Passo>

        <Passo numero={nDados} titulo="Seus dados" ativo={passoHoraOk}>
          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-1.5 block">
                {rotuloNome}
              </label>
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
              <label className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-1.5 block">
                Telefone / WhatsApp
              </label>
              <input
                type="tel"
                value={telefone}
                onChange={e => setTelefone(maskPhone(e.target.value))}
                required
                placeholder="(11) 99999-9999"
                className={inputClass}
              />
            </div>
          </div>
        </Passo>
      </div>

      {/* Resumo — lateral no desktop, empilhado no mobile */}
      <aside className="mt-10 lg:mt-0 lg:sticky lg:top-8 space-y-4">
        <ResumoAgendamento
          servico={servicoSel ? `${servicoSel.nome} (${servicoSel.duracao})` : (servicoId || null)}
          profissional={profissionalSel?.nome ?? null}
          data={data}
          horario={horario}
        />
        <button
          type="submit"
          disabled={submitting || !podeEnviar}
          className="w-full py-3.5 rounded-xl text-sm font-semibold text-white bg-[#25D366] transition-all duration-200 hover:bg-[#128C7E] disabled:opacity-40 disabled:hover:bg-[#25D366]"
        >
          {submitting ? 'Agendando...' : textoBotao}
        </button>
      </aside>
    </form>
  )
}
