'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { maskName, maskPhone } from '@/lib/masks'

const HORARIOS = Array.from({ length: 25 }, (_, i) => {
  const minutos = 8 * 60 + i * 30
  if (minutos > 20 * 60) return null
  const h = String(Math.floor(minutos / 60)).padStart(2, '0')
  const m = minutos % 60 === 0 ? '00' : '30'
  return `${h}:${m}`
}).filter(Boolean) as string[]

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

function gerarProximosDias(qtd = 15) {
  const dias: { value: string; label: string }[] = []
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  for (let i = 0; i < qtd; i++) {
    const d = new Date(hoje)
    d.setDate(hoje.getDate() + i)
    const value = d.toISOString().slice(0, 10)
    const label = `${DIAS_SEMANA[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`
    dias.push({ value, label })
  }
  return dias
}

type Endereco    = { cep: string; rua: string; numero: string; bairro: string; cidade: string }
type HorarioDia  = { abertura: string; fechamento: string; fechado: boolean }
type HorariosMap = Record<string, HorarioDia>

// índice 0 (Dom) → 6 (Sáb) mapeado para as chaves do JSON de horários
const CHAVE_DIA = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']

type Negocio = {
  id: string
  nome: string
  slug: string
  telefone: string
  endereco: Endereco | null
  horarios: HorariosMap | null
}

type Servico      = { id: number; nome: string; duracao: string }
type Profissional = { id: number; nome: string; cargo: string }

function formatarEndereco(e: Endereco | null): string | null {
  if (!e) return null
  const partes = [
    e.rua && e.numero ? `${e.rua}, ${e.numero}` : e.rua,
    e.bairro,
    e.cidade,
  ].filter(Boolean)
  return partes.length > 0 ? partes.join(' — ') : null
}

const selectClass = 'w-full border border-[#e5e7eb] rounded-2xl px-4 py-3 text-sm text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent'
const inputClass  = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#25D366] placeholder-gray-300'
const labelClass  = 'text-xs uppercase tracking-widest text-gray-500 font-medium mb-1.5 block'

export default function AgendarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params)

  const [negocio,       setNegocio]       = useState<Negocio | null>(null)
  const [servicos,      setServicos]      = useState<Servico[]>([])
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [notFound,      setNotFound]      = useState(false)
  const [loading,       setLoading]       = useState(true)
  const [submitting,    setSubmitting]    = useState(false)
  const [sucesso,       setSucesso]       = useState(false)
  const [erro,          setErro]          = useState('')

  // Campos do formulário
  const [nome,          setNome]          = useState('')
  const [telefone,      setTelefone]      = useState('')
  const [servicoId,     setServicoId]     = useState('')
  const [profissionalId, setProfissionalId] = useState('')
  const [data,          setData]          = useState('')
  const [horario,       setHorario]       = useState('')

  const supabase = createClient()

  // Horários disponíveis para a data selecionada
  const horariosDisponiveis = useMemo<string[] | null>(() => {
    if (!data) return null
    const [ano, mes, dia] = data.split('-').map(Number)
    // new Date(ano, mes-1, dia) usa fuso local — sem off-by-one
    const diaSemana = new Date(ano, mes - 1, dia).getDay()
    const chave = CHAVE_DIA[diaSemana]
    const horarios = negocio?.horarios
    if (!horarios) return HORARIOS                      // sem config → todos disponíveis
    const conf = horarios[chave]
    if (!conf) return HORARIOS.filter(h => h >= '08:00' && h <= '18:00')
    if (conf.fechado) return []                         // vazio = fechado
    return HORARIOS.filter(h => h >= conf.abertura && h <= conf.fechamento)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, JSON.stringify(negocio?.horarios)])

  const diaFechado = horariosDisponiveis !== null && horariosDisponiveis.length === 0

  useEffect(() => {
    async function init() {
      const { data: neg, error } = await supabase
        .from('negocios')
        .select('id, nome, slug, telefone, endereco, horarios')
        .eq('slug', slug)
        .single()

      if (error || !neg) { setNotFound(true); setLoading(false); return }

      setNegocio(neg)

      const [{ data: srvData }, { data: profData }] = await Promise.all([
        supabase.from('servicos').select('id, nome, duracao').eq('negocio_id', neg.id),
        supabase.from('profissionais').select('id, nome, cargo').eq('negocio_id', neg.id),
      ])

      setServicos(srvData ?? [])
      setProfissionais(profData ?? [])
      setLoading(false)
    }
    init()
  }, [slug])

  async function enviarWhatsApp(tel: string, mensagem: string) {
    try {
      await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: tel, mensagem }),
      })
    } catch (err) {
      console.error('Falha ao enviar WhatsApp:', err)
    }
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!negocio) return

    setSubmitting(true)
    setErro('')

    const servicoSelecionado      = servicos.find(s => String(s.id) === servicoId)
    const profissionalSelecionado = profissionais.find(p => String(p.id) === profissionalId)

    const servicoTexto = servicoSelecionado
      ? `${servicoSelecionado.nome} (${servicoSelecionado.duracao})`
      : ''

    const data_hora      = new Date(`${data}T${horario}`).toISOString()
    const dataFormatada  = new Date(data_hora).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

    const { error } = await supabase.from('agendamentos').insert({
      negocio_id:       negocio.id,
      cliente_nome:     nome,
      cliente_telefone: telefone,
      servico:          servicoTexto,
      profissional:     profissionalSelecionado?.nome ?? null,
      data_hora,
      status:           'confirmado',
    })

    if (error) {
      setErro('Erro ao realizar agendamento. Tente novamente.')
      setSubmitting(false)
      return
    }

    setSucesso(true)
    setSubmitting(false)

    const profTexto = profissionalSelecionado ? ` com ${profissionalSelecionado.nome}` : ''
    const msgCliente = `Olá ${nome}! Seu agendamento em ${negocio.nome} foi confirmado para ${dataFormatada} às ${horario}${profTexto}. Até lá! 🗓️`
    enviarWhatsApp(telefone, msgCliente)

    if (negocio.telefone) {
      const msgDono = `Novo agendamento! ${nome} agendou ${servicoTexto}${profTexto} para ${dataFormatada} às ${horario}. Tel: ${telefone}`
      enviarWhatsApp(negocio.telefone, msgDono)
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Carregando...</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="text-center">
          <p className="text-[#25D366] font-bold text-lg mb-4">Marcaí</p>
          <p className="text-xl font-bold text-gray-900 mb-2">Negócio não encontrado</p>
          <p className="text-gray-500 text-sm">Verifique o link e tente novamente.</p>
        </div>
      </div>
    )
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-10 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-[#dcfce7]">
            <svg className="w-8 h-8 text-[#25D366]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-2">Marcaí</p>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Agendamento confirmado!</h2>
          <p className="text-gray-500 text-sm mb-1">
            Olá, <span className="font-medium text-gray-600">{nome}</span>!
          </p>
          <p className="text-gray-500 text-sm">
            Seu agendamento em{' '}
            <span className="font-medium text-gray-600">{negocio?.nome}</span>{' '}
            foi registrado com sucesso.
          </p>
          <button
            onClick={resetForm}
            className="mt-8 w-full py-3 rounded-xl text-sm font-semibold border-2 border-[#25D366] text-[#25D366] transition-all duration-200 hover:bg-[#dcfce7] hover:scale-[1.02]"
          >
            Fazer outro agendamento
          </button>
        </div>
      </div>
    )
  }

  const enderecoFormatado = formatarEndereco(negocio?.endereco ?? null)

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8">

        {/* Cabeçalho */}
        <div className="mb-8">
          <p className="text-xs font-bold tracking-widest uppercase mb-4 text-[#25D366]">Marcaí</p>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{negocio?.nome}</h1>
          {enderecoFormatado && (
            <p className="text-sm text-gray-500 mt-1">{enderecoFormatado}</p>
          )}
          <p className="text-gray-400 text-sm mt-1">Preencha os dados para agendar</p>
        </div>

        {erro && (
          <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl mb-6">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelClass}>Seu nome</label>
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

          <div>
            <label className={labelClass}>Serviço desejado</label>
            {servicos.length > 0 ? (
              <select
                value={servicoId}
                onChange={e => setServicoId(e.target.value)}
                required
                className={selectClass}
              >
                <option value="">Selecione um serviço</option>
                {servicos.map(s => (
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
            )}
          </div>

          {profissionais.length > 0 && (
            <div>
              <label className={labelClass}>Profissional</label>
              <select
                value={profissionalId}
                onChange={e => setProfissionalId(e.target.value)}
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
            <label className={labelClass}>Data</label>
            <select
              value={data}
              onChange={e => { setData(e.target.value); setHorario('') }}
              required
              className={selectClass}
            >
              <option value="">Selecione uma data</option>
              {gerarProximosDias().map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
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
              {!data && (
                <option value="">Selecione uma data primeiro</option>
              )}
              {data && diaFechado && (
                <option value="">Fechado neste dia</option>
              )}
              {data && !diaFechado && (
                <>
                  <option value="">Selecione um horário</option>
                  {(horariosDisponiveis ?? HORARIOS).map(h => (
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
  )
}
