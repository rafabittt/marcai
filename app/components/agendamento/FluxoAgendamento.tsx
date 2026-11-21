'use client'

import { useMemo, useState } from 'react'
import { Check, CircleAlert } from 'lucide-react'
import { maskName, maskPhone } from '@/lib/masks'
import CalendarioInline from '@/app/components/CalendarioInline'
import { type HorariosMap } from '@/lib/agenda'
import { useDisponibilidade } from './useDisponibilidade'
import SeletorHorario, { Aviso } from './SeletorHorario'
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

// Campo de digitar do Grafite (16px no celular, anel verde no foco).
const inputClass = 'field'

// Cada passo é uma seção solta no fundo da página: o número num círculo
// discreto e o título. As escolhas dentro dela é que são os cartões
// (uma caixa por nível). Passo ainda bloqueado fica esmaecido.
function Passo({
  numero, titulo, ativo, children,
}: {
  numero: number; titulo: string; ativo: boolean; children: React.ReactNode
}) {
  return (
    <section
      className={`transition-opacity duration-200 ease-grafite ${ativo ? '' : 'opacity-40 pointer-events-none select-none'}`}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-6 h-6 rounded-full bg-fill text-muted text-[12px] font-semibold tabular flex items-center justify-center flex-none">
          {numero}
        </span>
        <h3 className="t-section">{titulo}</h3>
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
    // Uma coluna só, nas duas telas: a pública já é estreita (celular
    // primeiro) e a interna usa .page-narrow. O resumo e o botão ficam no fim.
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* Progresso — leve, só para dar noção de avanço */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <span className="t-cap">
            {feitos} de {totalPassos} escolhas feitas
          </span>
          <span className="t-cap tabular text-faint">{progresso}%</span>
        </div>
        <div className="h-1.5 w-full bg-fill rounded-full overflow-hidden">
          <div
            className="h-full w-full bg-accent rounded-full origin-left transition-transform duration-[280ms] ease-grafite"
            style={{ transform: `scaleX(${progresso / 100})` }}
          />
        </div>
      </div>

      <Passo numero={nServico} titulo="Escolha o serviço" ativo>
        {servicos.length > 0 && servicosAgendaveis.length === 0 ? (
          <Aviso>Nenhum serviço disponível para agendamento no momento.</Aviso>
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
            <Aviso>
              {passoServicoOk
                ? 'Nenhum profissional faz este serviço.'
                : 'Escolha um serviço para ver quem atende.'}
            </Aviso>
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
                      'card card-sm card-link w-full text-left !px-3.5 !py-3 min-h-[60px] flex items-center gap-3',
                      selecionado ? 'bg-ink text-ink-text border-transparent' : '',
                    ].join(' ')}
                  >
                    <span
                      aria-hidden
                      className={`avatar ${selecionado ? '!bg-ink-text/15 !text-ink-text' : ''}`}
                    >
                      {p.nome.trim().charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[15px] font-semibold truncate ${selecionado ? 'text-ink-text' : 'text-fg'}`}>{p.nome}</p>
                      {p.cargo && (
                        <p className={`t-cap truncate ${selecionado ? 'text-ink-text/70' : ''}`}>{p.cargo}</p>
                      )}
                    </div>
                    {selecionado && (
                      <Check size={16} strokeWidth={1.8} className="flex-none" aria-hidden />
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
          <label className="block">
            <span className="field-label">{rotuloNome}</span>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(maskName(e.target.value))}
              required
              placeholder="João Silva"
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="field-label">Telefone / WhatsApp</span>
            <input
              type="tel"
              value={telefone}
              onChange={e => setTelefone(maskPhone(e.target.value))}
              required
              placeholder="(11) 99999-9999"
              className={`${inputClass} tabular`}
            />
          </label>
        </div>
      </Passo>

      {/* Resumo e confirmar no fim. O erro do envio aparece logo acima do
          botão, onde a pessoa está olhando quando clica. */}
      <div className="space-y-[14px]">
        <ResumoAgendamento
          servico={servicoSel ? `${servicoSel.nome} (${servicoSel.duracao})` : (servicoId || null)}
          profissional={profissionalSel?.nome ?? null}
          data={data}
          horario={horario}
        />

        {erro && (
          <div className="note note-bad" role="alert">
            <CircleAlert size={18} strokeWidth={1.8} className="flex-none mt-px" aria-hidden />
            <span>{erro}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !podeEnviar}
          className="btn btn-primary btn-lg btn-block"
        >
          {submitting ? 'Agendando...' : textoBotao}
        </button>
      </div>
    </form>
  )
}
