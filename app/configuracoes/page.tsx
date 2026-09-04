'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { maskCEP, maskNumber, maskPhone } from '@/lib/masks'
import { getBuffer, getFolgas, localDateStr, type Intervalo, type HorariosMap as ConfigAgenda } from '@/lib/agenda'
import { X, Plus } from 'lucide-react'
import SidebarLayout from '@/app/components/SidebarLayout'
import GooLoader from '@/app/components/GooLoader'

// ── Constantes ────────────────────────────────────────────────────────────────

const TIPOS = [
  'Clínica', 'Barbearia', 'Salão de beleza', 'Estúdio de tatuagem',
  'Nutricionista', 'Psicólogo', 'Personal trainer', 'Loja', 'Outro',
]

const HORARIO_OPTIONS = Array.from({ length: 25 }, (_, i) => {
  const minutos = 8 * 60 + i * 30
  if (minutos > 20 * 60) return null
  const h = String(Math.floor(minutos / 60)).padStart(2, '0')
  const m = minutos % 60 === 0 ? '00' : '30'
  return `${h}:${m}`
}).filter(Boolean) as string[]

const DIAS = [
  { key: 'segunda', abr: 'Seg', fechadoPadrao: false },
  { key: 'terca',   abr: 'Ter', fechadoPadrao: false },
  { key: 'quarta',  abr: 'Qua', fechadoPadrao: false },
  { key: 'quinta',  abr: 'Qui', fechadoPadrao: false },
  { key: 'sexta',   abr: 'Sex', fechadoPadrao: false },
  { key: 'sabado',  abr: 'Sáb', fechadoPadrao: true  },
  { key: 'domingo', abr: 'Dom', fechadoPadrao: true   },
]

// ── Tipos ─────────────────────────────────────────────────────────────────────

type HorarioDia  = { abertura: string; fechamento: string; fechado: boolean; aberto24h?: boolean; intervalos?: Intervalo[] }
type HorariosMap = Record<string, HorarioDia>

type Endereco = {
  cep: string
  rua: string
  numero: string
  bairro: string
  cidade: string
  estado: string
}

type Negocio = {
  id: string
  nome: string
  tipo: string
  telefone: string
  slug: string
  // JSONB cru: chaves de dia + buffer_min/folgas. Lido via getBuffer/getFolgas.
  horarios: Record<string, unknown> | null
  endereco: Endereco | null
  exigir_cadastro_cliente?: boolean
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const HORARIOS_PADRAO: HorariosMap = Object.fromEntries(
  DIAS.map(({ key, fechadoPadrao }) => [
    key,
    { abertura: '08:00', fechamento: '18:00', fechado: fechadoPadrao },
  ])
)

const BUFFER_OPCOES = [0, 5, 10, 15, 20, 30]

const ENDERECO_PADRAO: Endereco = { cep: '', rua: '', numero: '', bairro: '', cidade: '', estado: '' }

// ── Helpers ───────────────────────────────────────────────────────────────────

function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function HorarioOptions() {
  return <>{HORARIO_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}</>
}

const inputClass = 'w-full border border-[#e5e7eb] rounded-2xl px-4 py-3 text-sm text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent'
const labelClass = 'text-xs uppercase tracking-widest text-gray-500 font-medium mb-1.5 block'

// ── Componente principal ──────────────────────────────────────────────────────

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(true)
  const [negocio, setNegocio] = useState<Negocio | null>(null)

  // Dados básicos
  const [negNome,     setNegNome]     = useState('')
  const [negTipo,     setNegTipo]     = useState(TIPOS[0])
  const [negTelefone, setNegTelefone] = useState('')
  const [negSlug,     setNegSlug]     = useState('')
  const [slugEditado, setSlugEditado] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopyLink = useCallback(() => {
    if (!negSlug) return
    navigator.clipboard.writeText(`https://marcai.net.br/agendar/${negSlug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [negSlug])

  // Endereço
  const [endereco, setEndereco] = useState<Endereco>(ENDERECO_PADRAO)

  // Horários
  const [horarios, setHorarios] = useState<HorariosMap>(HORARIOS_PADRAO)

  // Buffer entre atendimentos e folgas (guardados no mesmo JSONB de horarios)
  const [bufferMin,  setBufferMin]  = useState(0)
  const [folgas,     setFolgas]     = useState<string[]>([])
  const [novaFolga,  setNovaFolga]  = useState('')

  // Cadastro de cliente
  const [exigirCadastro, setExigirCadastro] = useState(false)

  // CEP
  const [cepLoading, setCepLoading] = useState(false)

  // Submit
  const [saving,  setSaving]  = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro,    setErro]    = useState('')

  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const { data: neg, error: negError } = await supabase
        .from('negocios')
        .select('id, nome, tipo, telefone, slug, horarios, endereco, exigir_cadastro_cliente')
        .eq('user_id', user.id)
        .maybeSingle()

      if (negError) { console.error('[configuracoes] erro na query:', negError); setLoading(false); return }
      if (!neg) { setLoading(false); return }

      setNegocio(neg)
      setNegNome(neg.nome)
      setNegTipo(neg.tipo ?? TIPOS[0])
      setNegTelefone(neg.telefone ?? '')
      setNegSlug(neg.slug)
      setHorarios((neg.horarios as HorariosMap | null) ?? HORARIOS_PADRAO)
      setBufferMin(getBuffer(neg.horarios as ConfigAgenda | null))
      setFolgas(getFolgas(neg.horarios as ConfigAgenda | null))
      setEndereco(neg.endereco ?? ENDERECO_PADRAO)
      setExigirCadastro(neg.exigir_cadastro_cliente ?? false)

      setLoading(false)
    }
    init()
  }, [])

  function handleNegNomeChange(value: string) {
    setNegNome(value)
    if (!slugEditado) setNegSlug(toSlug(value))
  }

  function handleNegSlugChange(value: string) {
    setSlugEditado(true)
    setNegSlug(toSlug(value))
  }

  function handleHorario(key: string, campo: keyof HorarioDia, valor: string | boolean) {
    setHorarios(prev => ({ ...prev, [key]: { ...prev[key], [campo]: valor } }))
  }

  function handleAberto24h(key: string, ativo: boolean) {
    setHorarios(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        aberto24h: ativo,
        abertura:  ativo ? '00:00' : '08:00',
        fechamento: ativo ? '23:59' : '18:00',
        fechado:   false,
      },
    }))
  }

  function handleAddIntervalo(key: string) {
    setHorarios(prev => {
      const dia = prev[key] ?? HORARIOS_PADRAO[key]
      const atuais = dia.intervalos ?? []
      return { ...prev, [key]: { ...dia, intervalos: [...atuais, { inicio: '12:00', fim: '13:00' }] } }
    })
  }

  function handleRemoveIntervalo(key: string, idx: number) {
    setHorarios(prev => {
      const dia = prev[key] ?? HORARIOS_PADRAO[key]
      const atuais = (dia.intervalos ?? []).filter((_, i) => i !== idx)
      return { ...prev, [key]: { ...dia, intervalos: atuais } }
    })
  }

  function handleIntervalo(key: string, idx: number, campo: keyof Intervalo, valor: string) {
    setHorarios(prev => {
      const dia = prev[key] ?? HORARIOS_PADRAO[key]
      const atuais = (dia.intervalos ?? []).map((iv, i) => i === idx ? { ...iv, [campo]: valor } : iv)
      return { ...prev, [key]: { ...dia, intervalos: atuais } }
    })
  }

  function handleAddFolga() {
    if (!novaFolga) return
    setFolgas(prev => prev.includes(novaFolga) ? prev : [...prev, novaFolga].sort())
    setNovaFolga('')
  }

  function handleRemoveFolga(data: string) {
    setFolgas(prev => prev.filter(d => d !== data))
  }

  function handleEndereco(campo: keyof Endereco, valor: string) {
    setEndereco(prev => ({ ...prev, [campo]: valor }))
  }

  async function handleCEPChange(valor: string) {
    const masked = maskCEP(valor)
    setEndereco(prev => ({ ...prev, cep: masked }))

    const digits = masked.replace(/\D/g, '')
    if (digits.length === 8) {
      setCepLoading(true)
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setEndereco(prev => ({
            ...prev,
            cep: masked,
            rua: data.logradouro || prev.rua,
            bairro: data.bairro || prev.bairro,
            cidade: data.localidade || prev.cidade,
            estado: data.uf || prev.estado,
          }))
        }
      } catch {}
      setCepLoading(false)
    }
  }

  async function handleSalvar(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!negSlug) { setErro('O link público não pode ficar vazio.'); return }

    setSaving(true)
    setSucesso(false)
    setErro('')

    // Verifica unicidade do slug apenas se mudou
    if (negSlug !== negocio?.slug) {
      const { data: existing } = await supabase
        .from('negocios').select('id').eq('slug', negSlug).maybeSingle()
      if (existing) {
        setErro('Esse link já está em uso. Escolha outro.')
        setSaving(false)
        return
      }
    }

    const negocioId = negocio!.id

    // buffer e folgas moram no mesmo JSONB dos dias — sem coluna nova
    const horariosCompletos: Record<string, unknown> = { ...horarios, buffer_min: bufferMin, folgas }

    // A: update negocios (dados básicos + horários + endereço)
    const negUpdate = supabase
      .from('negocios')
      .update({ nome: negNome, tipo: negTipo, telefone: negTelefone, slug: negSlug, horarios: horariosCompletos, endereco, exigir_cadastro_cliente: exigirCadastro })
      .eq('id', negocioId)

    const negResult = await negUpdate

    if (negResult.error) {
      setErro('Erro ao salvar. Tente novamente.')
    } else {
      setSucesso(true)
      setNegocio(prev => prev
        ? { ...prev, nome: negNome, tipo: negTipo, telefone: negTelefone, slug: negSlug, horarios: horariosCompletos, endereco, exigir_cadastro_cliente: exigirCadastro }
        : prev
      )
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f9f9f9' }}>
        <GooLoader />
      </div>
    )
  }

  return (
    <SidebarLayout>
    <div className="py-14 px-6">
      <div className="max-w-2xl mx-auto space-y-8">

        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Configurações</h1>
          <p className="text-gray-500 mt-1 text-sm">Gerencie as informações e preferências do seu negócio.</p>
        </div>

        {!negocio ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <p className="text-gray-500 text-sm">Nenhum negócio encontrado. Faça o cadastro primeiro.</p>
          </div>
        ) : (
          <form onSubmit={handleSalvar} className="space-y-8">

            {/* 1. DADOS BÁSICOS */}
            <Section title="Dados básicos">
              <div className="space-y-5">
                <div>
                  <label className={labelClass}>Nome do negócio</label>
                  <input
                    type="text"
                    value={negNome}
                    onChange={e => handleNegNomeChange(e.target.value)}
                    required
                    placeholder="Barbearia do João"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Tipo do negócio</label>
                  <select
                    value={negTipo}
                    onChange={e => setNegTipo(e.target.value)}
                    className={inputClass}
                  >
                    {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Telefone / WhatsApp</label>
                  <input
                    type="tel"
                    value={negTelefone}
                    onChange={e => setNegTelefone(maskPhone(e.target.value))}
                    required
                    placeholder="(11) 99999-9999"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Link público</label>
                  <input
                    type="text"
                    value={negSlug}
                    onChange={e => handleNegSlugChange(e.target.value)}
                    required
                    placeholder="barbearia-do-joao"
                    className={inputClass}
                  />
                  {negSlug && (
                    <div className="mt-2 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                      <span className="flex-1 text-xs text-gray-500 truncate">
                        marcai.net.br/agendar/<span className="text-[#25D366] font-medium">{negSlug}</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        title="Copiar link"
                        className="shrink-0 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors"
                        style={copied
                          ? { borderColor: '#25D366', color: '#25D366', backgroundColor: '#dcfce7' }
                          : { borderColor: '#e5e7eb', color: '#6b7280', backgroundColor: 'white' }
                        }
                      >
                        {copied ? 'Copiado' : 'Copiar'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">Exigir cadastro do cliente</p>
                  <p className="text-xs text-gray-400 mt-0.5">Clientes precisarão criar uma conta antes de agendar</p>
                </div>
                <button
                  type="button"
                  onClick={() => setExigirCadastro(p => !p)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${exigirCadastro ? 'bg-[#25D366]' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${exigirCadastro ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </Section>

            {/* 2. ENDEREÇO */}
            <Section title="Endereço">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-36">
                    <label className={labelClass}>CEP</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={endereco.cep || ''}
                        onChange={e => handleCEPChange(e.target.value)}
                        placeholder="00000-000"
                        maxLength={9}
                        className={inputClass}
                      />
                      {cepLoading && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                          ...
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className={labelClass}>Cidade</label>
                    <input
                      type="text"
                      value={endereco.cidade || ''}
                      readOnly
                      placeholder="Preenchido pelo CEP"
                      className={`${inputClass} bg-gray-100 text-gray-500 cursor-not-allowed focus:ring-0`}
                    />
                  </div>
                  <div className="w-20">
                    <label className={labelClass}>Estado</label>
                    <input
                      type="text"
                      value={endereco.estado || ''}
                      readOnly
                      placeholder="UF"
                      className={`${inputClass} bg-gray-100 text-gray-500 cursor-not-allowed focus:ring-0`}
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className={labelClass}>Rua</label>
                    <input
                      type="text"
                      value={endereco.rua || ''}
                      readOnly
                      placeholder="Preenchida pelo CEP"
                      className={`${inputClass} bg-gray-100 text-gray-500 cursor-not-allowed focus:ring-0`}
                    />
                  </div>
                  <div className="w-28">
                    <label className={labelClass}>Número</label>
                    <input
                      type="text"
                      value={endereco.numero || ''}
                      onChange={e => handleEndereco('numero', maskNumber(e.target.value))}
                      placeholder="1000"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Bairro</label>
                  <input
                    type="text"
                    value={endereco.bairro || ''}
                    readOnly
                    placeholder="Preenchido pelo CEP"
                    className={`${inputClass} bg-gray-100 text-gray-500 cursor-not-allowed focus:ring-0`}
                  />
                </div>
              </div>
            </Section>

            {/* 3. HORÁRIOS */}
            <Section title="Horários de funcionamento">
              <div className="space-y-2">
                {DIAS.map(({ key, abr }) => {
                  const dia = horarios?.[key] ?? HORARIOS_PADRAO[key]
                  return (
                    <div key={key} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500 w-8 flex-shrink-0">{abr}</span>
                        <select
                          value={dia.fechado || dia.aberto24h ? '' : dia.abertura}
                          disabled={dia.fechado || !!dia.aberto24h}
                          onChange={e => handleHorario(key, 'abertura', e.target.value)}
                          className="flex-1 border border-[#e5e7eb] rounded-2xl px-4 py-3 text-sm text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#25D366] disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          {dia.aberto24h && <option value="">00:00</option>}
                          <HorarioOptions />
                        </select>
                        <span className="text-xs text-gray-400 flex-shrink-0">até</span>
                        <select
                          value={dia.fechado || dia.aberto24h ? '' : dia.fechamento}
                          disabled={dia.fechado || !!dia.aberto24h}
                          onChange={e => handleHorario(key, 'fechamento', e.target.value)}
                          className="flex-1 border border-[#e5e7eb] rounded-2xl px-4 py-3 text-sm text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#25D366] disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          {dia.aberto24h && <option value="">23:59</option>}
                          <HorarioOptions />
                        </select>
                        <button
                          type="button"
                          onClick={() => handleHorario(key, 'fechado', !dia.fechado)}
                          className={`text-xs font-medium w-14 text-right flex-shrink-0 transition-colors ${dia.fechado ? 'text-gray-400 hover:text-gray-600' : 'text-[#128C7E] hover:text-[#25D366]'}`}
                        >
                          {dia.fechado ? 'Fechado' : 'Aberto'}
                        </button>
                      </div>
                      {!dia.fechado && (
                        <div className="flex items-center gap-2 pl-10">
                          <button
                            type="button"
                            onClick={() => handleAberto24h(key, !dia.aberto24h)}
                            className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors flex-shrink-0 ${dia.aberto24h ? 'bg-[#25D366]' : 'bg-gray-200'}`}
                          >
                            <span className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform ${dia.aberto24h ? 'translate-x-4' : 'translate-x-0.5'}`} />
                          </button>
                          <span className="text-xs text-gray-500">Aberto 24 horas</span>
                        </div>
                      )}

                      {/* Pausas dentro do expediente (almoco, cafe) */}
                      {!dia.fechado && !dia.aberto24h && (
                        <div className="pl-10 space-y-1.5 pb-1">
                          {(dia.intervalos ?? []).map((iv, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 w-12 flex-shrink-0">Pausa</span>
                              <select
                                value={iv.inicio}
                                onChange={e => handleIntervalo(key, idx, 'inicio', e.target.value)}
                                className="flex-1 border border-[#e5e7eb] rounded-xl px-3 py-2 text-xs text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                              >
                                <HorarioOptions />
                              </select>
                              <span className="text-xs text-gray-400 flex-shrink-0">até</span>
                              <select
                                value={iv.fim}
                                onChange={e => handleIntervalo(key, idx, 'fim', e.target.value)}
                                className="flex-1 border border-[#e5e7eb] rounded-xl px-3 py-2 text-xs text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                              >
                                <HorarioOptions />
                              </select>
                              <button
                                type="button"
                                onClick={() => handleRemoveIntervalo(key, idx)}
                                aria-label="Remover pausa"
                                className="text-gray-300 hover:text-red-400 transition-colors p-1 flex-shrink-0"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleAddIntervalo(key)}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#128C7E] transition-colors"
                          >
                            <Plus size={12} />
                            Adicionar pausa
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Buffer entre atendimentos */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <label className={labelClass}>Intervalo entre atendimentos</label>
                <div className="flex items-center gap-3">
                  <select
                    value={bufferMin}
                    onChange={e => setBufferMin(Number(e.target.value))}
                    className="w-40 border border-[#e5e7eb] rounded-2xl px-4 py-3 text-sm text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                  >
                    {BUFFER_OPCOES.map(m => (
                      <option key={m} value={m}>{m === 0 ? 'Sem intervalo' : `${m} minutos`}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 flex-1">
                    Tempo reservado após cada atendimento para preparo ou limpeza.
                    Vale para todos os serviços.
                  </p>
                </div>
              </div>
            </Section>

            {/* 4. FOLGAS */}
            <Section title="Folgas e feriados">
              <p className="text-xs text-gray-500 mb-5">
                Dias em que o negócio não atende. A agenda pública fica indisponível
                nessas datas, mesmo que o dia da semana esteja aberto.
              </p>

              <div className="flex gap-2 mb-5">
                <input
                  type="date"
                  value={novaFolga}
                  min={localDateStr()}
                  onChange={e => setNovaFolga(e.target.value)}
                  className="flex-1 border border-[#e5e7eb] rounded-2xl px-4 py-3 text-sm text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                />
                <button
                  type="button"
                  onClick={handleAddFolga}
                  disabled={!novaFolga}
                  className="px-5 py-3 rounded-2xl text-sm font-semibold text-white bg-[#25D366] transition-colors hover:bg-[#128C7E] disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                >
                  Adicionar
                </button>
              </div>

              {folgas.length === 0 ? (
                <p className="text-sm text-gray-400">Nenhuma folga cadastrada.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {folgas.map(d => (
                    <span
                      key={d}
                      className="inline-flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full pl-4 pr-2 py-1.5 text-sm text-gray-700"
                    >
                      {new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                      <button
                        type="button"
                        onClick={() => handleRemoveFolga(d)}
                        aria-label={`Remover folga ${d}`}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </Section>

            {/* BOTÃO GLOBAL + FEEDBACK */}
            <div className="space-y-3">
              {sucesso && (
                <div className="bg-[#dcfce7] text-[#128C7E] text-sm px-4 py-3 rounded-xl">
                  Alterações salvas com sucesso.
                </div>
              )}
              {erro && (
                <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl">
                  {erro}
                </div>
              )}
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 rounded-xl text-sm font-semibold text-white bg-[#25D366] transition-all duration-200 hover:bg-[#128C7E] hover:scale-[1.02] disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar todas as alterações'}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
    </SidebarLayout>
  )
}

// ── Layout helper ─────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
      <h2 className="text-xs uppercase tracking-widest font-semibold text-gray-500 mb-6">{title}</h2>
      {children}
    </div>
  )
}
