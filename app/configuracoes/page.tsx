'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { maskCEP, maskNumber, maskPhone } from '@/lib/masks'
import { getBuffer, getFolgas, localDateStr, type Intervalo, type HorariosMap as ConfigAgenda } from '@/lib/agenda'
import { X, Plus, Copy, Check } from 'lucide-react'
import EditorMensagem from '@/app/components/EditorMensagem'
import {
  getTemplateCliente, getTemplateDono, exemploVariaveis,
  CHAVE_MSG_CLIENTE, CHAVE_MSG_DONO, MSG_CLIENTE_PADRAO, MSG_DONO_PADRAO,
} from '@/lib/mensagens'
import SidebarLayout from '@/app/components/SidebarLayout'
import Carregando from '@/app/components/Carregando'

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

// Campo preenchido pelo CEP: só leitura, com cara de "não é para digitar aqui".
const campoTravado = 'field bg-fill text-muted cursor-not-allowed'
// Select de horário compacto (grade dos dias e pausas)
const campoHora = 'field tabular md:min-h-10'

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

  // Templates das mensagens de confirmação — moram no mesmo JSONB de horarios,
  // junto de buffer_min e folgas.
  const [msgCliente, setMsgCliente] = useState(MSG_CLIENTE_PADRAO)
  const [msgDono,    setMsgDono]    = useState(MSG_DONO_PADRAO)

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
        .select('id, nome, tipo, telefone, slug, horarios, endereco')
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
      setMsgCliente(getTemplateCliente(neg.horarios))
      setMsgDono(getTemplateDono(neg.horarios))
      setEndereco(neg.endereco ?? ENDERECO_PADRAO)

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
    // Dia ainda não salvo (negócio antigo sem esse dia no banco) parte do padrão,
    // senão gravava um dia incompleto (só o campo mexido).
    setHorarios(prev => ({ ...prev, [key]: { ...(prev[key] ?? HORARIOS_PADRAO[key]), [campo]: valor } }))
  }

  function handleAberto24h(key: string, ativo: boolean) {
    setHorarios(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] ?? HORARIOS_PADRAO[key]),
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

    // buffer, folgas e os templates de mensagem moram no mesmo JSONB dos dias
    // — sem coluna nova. Template igual ao padrão não é gravado: assim o
    // negócio continua acompanhando o default se ele mudar no futuro.
    const horariosCompletos: Record<string, unknown> = {
      ...horarios,
      buffer_min: bufferMin,
      folgas,
      [CHAVE_MSG_CLIENTE]: msgCliente,
      [CHAVE_MSG_DONO]:    msgDono,
    }

    // Template idêntico ao padrão sai do JSONB em vez de ser gravado, para o
    // negócio seguir acompanhando o default se ele mudar. Removido com delete,
    // e não atribuindo undefined: a chave precisa sumir de fato do objeto, não
    // depender de o serializador descartá-la.
    if (msgCliente.trim() === MSG_CLIENTE_PADRAO) delete horariosCompletos[CHAVE_MSG_CLIENTE]
    if (msgDono.trim()    === MSG_DONO_PADRAO)    delete horariosCompletos[CHAVE_MSG_DONO]

    // A: update negocios (dados básicos + horários + endereço)
    const negUpdate = supabase
      .from('negocios')
      .update({ nome: negNome, tipo: negTipo, telefone: negTelefone, slug: negSlug, horarios: horariosCompletos, endereco })
      .eq('id', negocioId)

    const negResult = await negUpdate

    if (negResult.error) {
      setErro('Erro ao salvar. Tente novamente.')
    } else {
      setSucesso(true)
      setNegocio(prev => prev
        ? { ...prev, nome: negNome, tipo: negTipo, telefone: negTelefone, slug: negSlug, horarios: horariosCompletos, endereco }
        : prev
      )
    }
    setSaving(false)
  }

  // Exemplo do preview: usa o nome real do negócio para o dono ver a mensagem
  // como ela vai sair.
  const exemplo = useMemo(() => exemploVariaveis(negNome), [negNome])

  if (loading) {
    return (
      <SidebarLayout>
        <Carregando />
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout>
    <main className="page page-narrow">

      <div className="page-head">
        <div className="min-w-0">
          <h1 className="t-title">Configurações</h1>
          <p className="t-sub">Gerencie as informações e preferências do seu negócio.</p>
        </div>
      </div>

      {!negocio ? (
        <section className="card empty">
          <p className="t-cap">Nenhum negócio encontrado. Faça o cadastro primeiro.</p>
        </section>
      ) : (
        <form
          onSubmit={handleSalvar}
          // Qualquer mexida depois de salvar apaga o "salvo com sucesso", senão o
          // aviso ficava na tela mesmo com alterações ainda não salvas.
          onChangeCapture={() => setSucesso(false)}
          onClickCapture={e => {
            if ((e.target as HTMLElement).closest('button:not([type="submit"])')) setSucesso(false)
          }}
          className="space-y-[14px]"
        >

          {/* 1. DADOS BÁSICOS */}
          <Section title="Dados básicos">
            <div className="space-y-4">
              <div>
                <label htmlFor="cfg-nome" className="field-label">Nome do negócio</label>
                <input
                  id="cfg-nome"
                  type="text"
                  value={negNome}
                  onChange={e => handleNegNomeChange(e.target.value)}
                  required
                  placeholder="Barbearia do João"
                  className="field"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
                <div>
                  <label htmlFor="cfg-tipo" className="field-label">Tipo do negócio</label>
                  <select
                    id="cfg-tipo"
                    value={negTipo}
                    onChange={e => setNegTipo(e.target.value)}
                    className="field"
                  >
                    {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label htmlFor="cfg-telefone" className="field-label">Telefone / WhatsApp</label>
                  <input
                    id="cfg-telefone"
                    type="tel"
                    value={negTelefone}
                    onChange={e => setNegTelefone(maskPhone(e.target.value))}
                    required
                    placeholder="(11) 99999-9999"
                    className="field tabular"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cfg-slug" className="field-label">Link público</label>
                <input
                  id="cfg-slug"
                  type="text"
                  value={negSlug}
                  onChange={e => handleNegSlugChange(e.target.value)}
                  required
                  placeholder="barbearia-do-joao"
                  className="field"
                />
                {negSlug && (
                  <div className="mt-2 flex items-center gap-2 rounded-inner bg-fill pl-3 pr-1.5 py-1.5">
                    <span className="flex-1 min-w-0 text-[13px] text-muted truncate">
                      marcai.net.br/agendar/<span className="text-accent-ink font-medium">{negSlug}</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      title="Copiar link"
                      className="btn btn-sm shrink-0"
                    >
                      {copied
                        ? <Check size={14} strokeWidth={2} className="text-accent-ink" aria-hidden />
                        : <Copy size={14} strokeWidth={1.8} aria-hidden />}
                      <span aria-live="polite">{copied ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

          </Section>

          {/* 2. ENDEREÇO */}
          <Section title="Endereço">
            <div className="space-y-4">
              <div className="grid grid-cols-[1fr_5rem] sm:grid-cols-[9rem_1fr_5rem] gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label htmlFor="cfg-cep" className="field-label">CEP</label>
                  <div className="relative">
                    <input
                      id="cfg-cep"
                      type="text"
                      value={endereco.cep || ''}
                      onChange={e => handleCEPChange(e.target.value)}
                      placeholder="00000-000"
                      maxLength={9}
                      className="field tabular"
                    />
                    {cepLoading && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 t-cap" aria-live="polite">
                        ...
                      </span>
                    )}
                  </div>
                </div>
                <div className="min-w-0">
                  <label htmlFor="cfg-cidade" className="field-label">Cidade</label>
                  <input
                    id="cfg-cidade"
                    type="text"
                    value={endereco.cidade || ''}
                    readOnly
                    placeholder="Preenchido pelo CEP"
                    className={campoTravado}
                  />
                </div>
                <div>
                  <label htmlFor="cfg-estado" className="field-label">Estado</label>
                  <input
                    id="cfg-estado"
                    type="text"
                    value={endereco.estado || ''}
                    readOnly
                    placeholder="UF"
                    className={campoTravado}
                  />
                </div>
              </div>
              <div className="grid grid-cols-[1fr_6rem] sm:grid-cols-[1fr_7rem] gap-3">
                <div className="min-w-0">
                  <label htmlFor="cfg-rua" className="field-label">Rua</label>
                  <input
                    id="cfg-rua"
                    type="text"
                    value={endereco.rua || ''}
                    readOnly
                    placeholder="Preenchida pelo CEP"
                    className={campoTravado}
                  />
                </div>
                <div>
                  <label htmlFor="cfg-numero" className="field-label">Número</label>
                  <input
                    id="cfg-numero"
                    type="text"
                    value={endereco.numero || ''}
                    onChange={e => handleEndereco('numero', maskNumber(e.target.value))}
                    placeholder="1000"
                    className="field tabular"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="cfg-bairro" className="field-label">Bairro</label>
                <input
                  id="cfg-bairro"
                  type="text"
                  value={endereco.bairro || ''}
                  readOnly
                  placeholder="Preenchido pelo CEP"
                  className={campoTravado}
                />
              </div>
            </div>
          </Section>

          {/* 3. HORÁRIOS — uma linha por dia: nome, interruptor aberto/fechado
              e o expediente. Pausas e "24 horas" ficam embaixo do expediente. */}
          <Section title="Horários de funcionamento">
            <div>
              {DIAS.map(({ key, abr }) => {
                const dia = horarios?.[key] ?? HORARIOS_PADRAO[key]
                return (
                  <div key={key} className="py-3 border-t border-hairline first:border-t-0 first:pt-0">
                    <div className="grid grid-cols-[44px_1fr] sm:grid-cols-[44px_112px_1fr] items-start gap-x-3 gap-y-2">
                      <span className="h-11 md:h-10 flex items-center text-[15px] font-medium text-fg">{abr}</span>

                      <div className="h-11 md:h-10 flex items-center gap-2.5">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={!dia.fechado}
                          aria-label={`${abr}: aberto`}
                          onClick={() => handleHorario(key, 'fechado', !dia.fechado)}
                          className="switch"
                        />
                        <span className={`text-[13px] ${dia.fechado ? 'text-muted' : 'text-fg font-medium'}`}>
                          {dia.fechado ? 'Fechado' : 'Aberto'}
                        </span>
                      </div>

                      {!dia.fechado && (
                        <div className="col-span-2 sm:col-span-1 space-y-2 min-w-0">
                          <div className="flex items-center gap-2">
                            <select
                              value={dia.fechado || dia.aberto24h ? '' : dia.abertura}
                              disabled={dia.fechado || !!dia.aberto24h}
                              onChange={e => handleHorario(key, 'abertura', e.target.value)}
                              aria-label={`${abr}: abre às`}
                              className={`${campoHora} flex-1 min-w-0`}
                            >
                              {dia.aberto24h && <option value="">00:00</option>}
                              <HorarioOptions />
                            </select>
                            <span className="t-cap shrink-0">até</span>
                            <select
                              value={dia.fechado || dia.aberto24h ? '' : dia.fechamento}
                              disabled={dia.fechado || !!dia.aberto24h}
                              onChange={e => handleHorario(key, 'fechamento', e.target.value)}
                              aria-label={`${abr}: fecha às`}
                              className={`${campoHora} flex-1 min-w-0`}
                            >
                              {dia.aberto24h && <option value="">23:59</option>}
                              <HorarioOptions />
                            </select>
                          </div>

                          <div className="flex items-center gap-2.5 min-h-8">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={!!dia.aberto24h}
                              aria-label={`${abr}: aberto 24 horas`}
                              onClick={() => handleAberto24h(key, !dia.aberto24h)}
                              className="switch"
                            />
                            <span className="t-cap">Aberto 24 horas</span>
                          </div>

                          {/* Pausas dentro do expediente (almoco, cafe) */}
                          {!dia.aberto24h && (
                            <div className="space-y-2">
                              {(dia.intervalos ?? []).map((iv, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <span className="t-cap w-11 shrink-0">Pausa</span>
                                  <select
                                    value={iv.inicio}
                                    onChange={e => handleIntervalo(key, idx, 'inicio', e.target.value)}
                                    aria-label={`${abr}: pausa começa às`}
                                    className={`${campoHora} flex-1 min-w-0`}
                                  >
                                    <HorarioOptions />
                                  </select>
                                  <span className="t-cap shrink-0">até</span>
                                  <select
                                    value={iv.fim}
                                    onChange={e => handleIntervalo(key, idx, 'fim', e.target.value)}
                                    aria-label={`${abr}: pausa termina às`}
                                    className={`${campoHora} flex-1 min-w-0`}
                                  >
                                    <HorarioOptions />
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveIntervalo(key, idx)}
                                    aria-label="Remover pausa"
                                    className="btn btn-ghost btn-icon btn-sm shrink-0 hover:text-bad-ink hover:bg-bad-bg"
                                  >
                                    <X size={15} strokeWidth={1.8} />
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => handleAddIntervalo(key)}
                                className="btn btn-ghost btn-sm -ml-3"
                              >
                                <Plus size={14} strokeWidth={1.8} aria-hidden />
                                Adicionar pausa
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Buffer entre atendimentos */}
            <div className="mt-4 pt-4 border-t border-hairline">
              <label htmlFor="cfg-buffer" className="field-label">Intervalo entre atendimentos</label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <select
                  id="cfg-buffer"
                  value={bufferMin}
                  onChange={e => setBufferMin(Number(e.target.value))}
                  className="field sm:w-48 shrink-0"
                >
                  {BUFFER_OPCOES.map(m => (
                    <option key={m} value={m}>{m === 0 ? 'Sem intervalo' : `${m} minutos`}</option>
                  ))}
                </select>
                <p className="t-cap flex-1">
                  Tempo reservado após cada atendimento para preparo ou limpeza.
                  Vale para todos os serviços.
                </p>
              </div>
            </div>
          </Section>

          {/* 4. FOLGAS */}
          <Section
            title="Folgas e feriados"
            descricao={<>
              Dias em que o negócio não atende. A agenda pública fica indisponível
              nessas datas, mesmo que o dia da semana esteja aberto.
            </>}
          >
            <div className="flex gap-2 mb-4">
              <input
                type="date"
                value={novaFolga}
                min={localDateStr()}
                onChange={e => setNovaFolga(e.target.value)}
                aria-label="Data da folga"
                className="field flex-1 min-w-0"
              />
              <button
                type="button"
                onClick={handleAddFolga}
                disabled={!novaFolga}
                className="btn h-11 shrink-0"
              >
                <Plus size={16} strokeWidth={1.8} aria-hidden />
                Adicionar
              </button>
            </div>

            {folgas.length === 0 ? (
              <p className="t-cap">Nenhuma folga cadastrada.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {folgas.map(d => (
                  <li
                    key={d}
                    className="inline-flex items-center gap-1 h-8 pl-3 pr-1 rounded-full bg-fill text-[13px] text-fg tabular"
                  >
                    {new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                    <button
                      type="button"
                      onClick={() => handleRemoveFolga(d)}
                      aria-label={`Remover folga ${d}`}
                      className="w-6 h-6 grid place-items-center rounded-full text-muted transition-colors duration-150 hover:text-bad-ink hover:bg-bad-bg"
                    >
                      <X size={13} strokeWidth={1.8} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* 5. MENSAGENS */}
          <Section
            title="Mensagens de confirmação"
            descricao={<>
              O que é enviado no WhatsApp quando um agendamento é confirmado.
              Clique numa variável para inseri-la no ponto do cursor. O que
              estiver entre colchetes <span className="font-mono">[ ]</span> some
              quando a variável dentro dele estiver vazia.
            </>}
          >
            <div>
              <EditorMensagem
                titulo="Para o cliente"
                descricao="Chega no WhatsApp de quem agendou."
                valor={msgCliente}
                onChange={setMsgCliente}
                padrao={MSG_CLIENTE_PADRAO}
                exemplo={exemplo}
              />
              <div className="border-t border-hairline my-6" />
              <EditorMensagem
                titulo="Para você"
                descricao="O aviso que chega no seu WhatsApp a cada novo agendamento."
                valor={msgDono}
                onChange={setMsgDono}
                padrao={MSG_DONO_PADRAO}
                exemplo={exemplo}
              />
            </div>
          </Section>

          {/* BOTÃO GLOBAL + FEEDBACK */}
          <div className="space-y-3 pt-1">
            {sucesso && (
              <div className="note note-ok" role="status">
                <Check size={16} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden />
                Alterações salvas com sucesso.
              </div>
            )}
            {erro && (
              <div className="note note-bad" role="alert">
                {erro}
              </div>
            )}
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary btn-lg btn-block"
            >
              {saving ? 'Salvando...' : 'Salvar todas as alterações'}
            </button>
          </div>

        </form>
      )}
    </main>
    </SidebarLayout>
  )
}

// ── Layout helper ─────────────────────────────────────────────────────────────
// Uma seção = um cartão: título, legenda opcional e o conteúdo. Dentro, as
// partes se separam por linha fina (border-t border-hairline), nunca por outra
// caixa.

function Section({
  title, descricao, children,
}: {
  title: string
  descricao?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="card">
      <h2 className="t-section">{title}</h2>
      {descricao && <p className="t-cap mt-1">{descricao}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}
