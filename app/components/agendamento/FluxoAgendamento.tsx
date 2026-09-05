'use client'

import { useMemo, useState } from 'react'
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
const selectClass = 'w-full border border-[#e5e7eb] rounded-2xl px-4 py-3 text-sm text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent'

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

  // Cada serviço pertence a um profissional (servicos.profissional_id). Quando
  // o serviço escolhido já define quem atende, o passo do profissional some —
  // perguntar seria pedir uma informação que já foi dada.
  const profissionalDoServico = useMemo(() => {
    if (!servicoSel?.profissional_id) return null
    return profissionais.find(p => String(p.id) === String(servicoSel.profissional_id)) ?? null
  }, [servicoSel, profissionais])

  const profissionalEfetivoId = profissionalDoServico
    ? String(profissionalDoServico.id)
    : profissionalId

  const profissionalSel = profissionalDoServico
    ?? profissionais.find(p => String(p.id) === profissionalId)
    ?? null

  // Estável de propósito: se TODO serviço já aponta um profissional, o passo
  // nunca vai ser necessário. Decidir isso só depois da escolha faria o total
  // de passos pular de 5 para 4 no meio do fluxo.
  const servicosDefinemProfissional =
    servicos.length > 0 && servicos.every(s => !!s.profissional_id)

  const precisaEscolherProfissional =
    !servicosDefinemProfissional && !profissionalDoServico && profissionais.length > 0

  // Precisa ser o profissional EFETIVO, não o escolhido à mão: quando o
  // serviço já define quem atende, `profissionalId` fica vazio, e sem filtro
  // a rota de ocupados devolve as reservas de todos — a agenda de um
  // profissional passaria a bloquear horário do outro.
  const { livres, diaFechado, lotado, carregando } =
    useDisponibilidade(negocioId, horarios, data, profissionalEfetivoId)

  function trocarServico(id: string) {
    setServicoId(id)
    // Trocar de serviço pode trocar de profissional, e a disponibilidade é por
    // profissional — o horário já escolhido deixa de valer.
    setHorario('')
    if (!servicos.some(s => String(s.id) === id && s.profissional_id)) return
    setProfissionalId('')
  }

  const passoServicoOk = servicoId !== ''
  const passoProfOk    = !precisaEscolherProfissional || profissionalId !== ''
  const passoDataOk    = data !== ''
  const passoHoraOk    = horario !== ''
  const podeEnviar     = passoServicoOk && passoProfOk && passoDataOk && passoHoraOk
    && nome.trim() !== '' && telefone.trim() !== ''

  const totalPassos = precisaEscolherProfissional ? 5 : 4
  const feitos = [passoServicoOk, precisaEscolherProfissional ? passoProfOk : null, passoDataOk, passoHoraOk]
    .filter(v => v === true).length
  const progresso = Math.round((feitos / totalPassos) * 100)

  let n = 0
  const nServico = ++n
  const nProf    = precisaEscolherProfissional ? ++n : 0
  const nData    = ++n
  const nHora    = ++n
  const nDados   = ++n

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({ nome, telefone, servicoId, profissionalId: profissionalEfetivoId, data, horario })
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
          <CardsServico
            servicos={servicos}
            valor={servicoId}
            onChange={trocarServico}
            inputClass={inputClass}
          />
        </Passo>

        {precisaEscolherProfissional && (
          <Passo numero={nProf} titulo="Escolha o profissional" ativo={passoServicoOk}>
            <select
              value={profissionalId}
              onChange={e => { setProfissionalId(e.target.value); setHorario('') }}
              className={selectClass}
            >
              <option value="">Selecione um profissional</option>
              {profissionais.map(p => (
                <option key={p.id} value={String(p.id)}>
                  {p.nome}{p.cargo ? ` — ${p.cargo}` : ''}
                </option>
              ))}
            </select>
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
