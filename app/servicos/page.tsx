'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import SidebarLayout from '@/app/components/SidebarLayout'
import GooLoader from '@/app/components/GooLoader'
import { parsePreco, precoParaInput } from '@/lib/preco'
import { Check, Trash2, Plus } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Catálogo de serviços.
//
// Serviço é a entidade do catálogo, não algo que pertence a um profissional —
// numa barbearia com três barbeiros, os três fazem o mesmo corte. Quem executa
// vive na junção servico_profissional, e a atribuição é feita aqui, como em
// Fresha e GoDaddy.
//
// servicos.profissional_id é legado. Continua sendo gravada com o PRIMEIRO
// profissional marcado porque o fluxo de agendamento ainda lê essa coluna; a
// troca para a junção é a Etapa D. Sem isso, serviço criado aqui sumiria da
// tela de agendamento.
// ─────────────────────────────────────────────────────────────────────────────

const DURACOES = ['15 min', '30 min', '45 min', '1h', '1h 30min', '2h', '2h 30min', '3h']

type Profissional = { id: string; nome: string; cargo: string }

type Servico = {
  id: string
  nome: string
  duracao: string
  preco: number | null
  profissionaisIds: string[]
}

/** Estado editável de um serviço — o preço fica como texto enquanto se digita. */
type Rascunho = { nome: string; duracao: string; preco: string; profissionaisIds: string[] }

const inputClass = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#25D366] placeholder-gray-300'
const labelClass = 'text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1.5 block'

function rascunhoDe(s: Servico): Rascunho {
  return { nome: s.nome, duracao: s.duracao, preco: precoParaInput(s.preco), profissionaisIds: [...s.profissionaisIds] }
}

function mudou(a: Rascunho, s: Servico): boolean {
  return a.nome.trim() !== s.nome
    || a.duracao !== s.duracao
    || parsePreco(a.preco) !== s.preco
    || [...a.profissionaisIds].sort().join() !== [...s.profissionaisIds].sort().join()
}

// ── Multi-select de profissionais ────────────────────────────────────────────

function QuemFaz({
  profissionais, marcados, onToggle,
}: {
  profissionais: Profissional[]
  marcados: string[]
  onToggle: (id: string) => void
}) {
  if (profissionais.length === 0) {
    return (
      <p className="text-xs text-gray-400">
        Nenhum profissional cadastrado ainda —{' '}
        <a href="/profissionais" className="text-[#128C7E] underline">cadastre a equipe</a>{' '}
        para poder atribuir.
      </p>
    )
  }
  return (
    <div className="flex flex-wrap gap-2">
      {profissionais.map(p => {
        const on = marcados.includes(p.id)
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onToggle(p.id)}
            aria-pressed={on}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              on
                ? 'bg-[#25D366] text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-[#25D366]',
            ].join(' ')}
          >
            {on && <Check size={12} strokeWidth={3} />}
            {p.nome}
          </button>
        )
      })}
    </div>
  )
}

// ── Página ───────────────────────────────────────────────────────────────────

export default function ServicosPage() {
  const [loading,       setLoading]       = useState(true)
  const [negocioId,     setNegocioId]     = useState<string | null>(null)
  const [servicos,      setServicos]      = useState<Servico[]>([])
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [erro,          setErro]          = useState('')

  const [rascunhos, setRascunhos] = useState<Record<string, Rascunho>>({})
  const [salvando,  setSalvando]  = useState<string | null>(null)
  const [salvo,     setSalvo]     = useState<string | null>(null)

  const [novo, setNovo] = useState<Rascunho>({ nome: '', duracao: '30 min', preco: '', profissionaisIds: [] })
  const [criando, setCriando] = useState(false)

  // Memoizado: sem isso o cliente é recriado a cada render e vira dependência
  // instável de carregar/useEffect.
  const supabase = useMemo(() => createClient(), [])

  const carregar = useCallback(async (negId: string) => {
    const [{ data: srv }, { data: prof }] = await Promise.all([
      supabase.from('servicos').select('id, nome, duracao, preco').eq('negocio_id', negId).order('nome'),
      supabase.from('profissionais').select('id, nome, cargo').eq('negocio_id', negId).order('nome'),
    ])
    const ids = (srv ?? []).map(s => s.id)
    const { data: vinc } = ids.length
      ? await supabase.from('servico_profissional').select('servico_id, profissional_id').in('servico_id', ids)
      : { data: [] as { servico_id: string; profissional_id: string }[] }

    setProfissionais(prof ?? [])
    setServicos((srv ?? []).map(s => ({
      ...s,
      profissionaisIds: (vinc ?? []).filter(v => v.servico_id === s.id).map(v => v.profissional_id),
    })))
    setRascunhos({})
    // Com um profissional só, não faz sentido cobrar o clique de marcar.
    setNovo(n => ({ ...n, profissionaisIds: (prof ?? []).length === 1 ? [prof![0].id] : [] }))
  }, [supabase])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const { data: neg } = await supabase
        .from('negocios').select('id').eq('user_id', user.id).maybeSingle()
      if (!neg) { setLoading(false); return }
      setNegocioId(neg.id)
      await carregar(neg.id)
      setLoading(false)
    }
    init()
  }, [supabase, carregar])


  function rascunho(s: Servico): Rascunho {
    return rascunhos[s.id] ?? rascunhoDe(s)
  }

  function editar(s: Servico, campos: Partial<Rascunho>) {
    setRascunhos(prev => ({ ...prev, [s.id]: { ...rascunho(s), ...campos } }))
  }

  function toggleProf(s: Servico, profId: string) {
    const atual = rascunho(s).profissionaisIds
    editar(s, {
      profissionaisIds: atual.includes(profId) ? atual.filter(x => x !== profId) : [...atual, profId],
    })
  }

  /** Aplica a diferença de vínculos na junção: insere os que entraram, apaga os que saíram. */
  async function sincronizarVinculos(servicoId: string, antes: string[], depois: string[]) {
    const entraram = depois.filter(id => !antes.includes(id))
    const sairam   = antes.filter(id => !depois.includes(id))
    if (entraram.length) {
      await supabase.from('servico_profissional')
        .insert(entraram.map(profissional_id => ({ servico_id: servicoId, profissional_id })))
    }
    for (const profissional_id of sairam) {
      await supabase.from('servico_profissional')
        .delete().eq('servico_id', servicoId).eq('profissional_id', profissional_id)
    }
  }

  async function salvar(s: Servico) {
    const r = rascunho(s)
    if (!r.nome.trim()) return
    setSalvando(s.id)
    setErro('')

    const { error } = await supabase.from('servicos').update({
      nome: r.nome.trim(),
      duracao: r.duracao,
      preco: parsePreco(r.preco),
      // Coluna legada: primeiro marcado, para o fluxo de agendamento (que ainda
      // lê daqui até a Etapa D) continuar enxergando o serviço.
      profissional_id: r.profissionaisIds[0] ?? null,
    }).eq('id', s.id)

    if (error) { setErro('Erro ao salvar o serviço.'); setSalvando(null); return }

    await sincronizarVinculos(s.id, s.profissionaisIds, r.profissionaisIds)
    if (negocioId) await carregar(negocioId)
    setSalvando(null)
    setSalvo(s.id)
    setTimeout(() => setSalvo(atual => atual === s.id ? null : atual), 1800)
  }

  async function criar() {
    if (!negocioId || !novo.nome.trim()) return
    setCriando(true)
    setErro('')

    const { data, error } = await supabase.from('servicos').insert({
      negocio_id: negocioId,
      nome: novo.nome.trim(),
      duracao: novo.duracao,
      preco: parsePreco(novo.preco),
      profissional_id: novo.profissionaisIds[0] ?? null,
    }).select('id').single()

    if (error || !data) { setErro('Erro ao criar o serviço.'); setCriando(false); return }

    await sincronizarVinculos(data.id, [], novo.profissionaisIds)
    setNovo({
      nome: '', duracao: '30 min', preco: '',
      profissionaisIds: profissionais.length === 1 ? [profissionais[0].id] : [],
    })
    await carregar(negocioId)
    setCriando(false)
  }

  async function remover(s: Servico) {
    // A junção tem ON DELETE CASCADE — os vínculos somem junto.
    await supabase.from('servicos').delete().eq('id', s.id)
    setServicos(prev => prev.filter(x => x.id !== s.id))
  }

  const semProfissional = useMemo(
    () => servicos.filter(s => s.profissionaisIds.length === 0),
    [servicos],
  )

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64"><GooLoader /></div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout>
      <div className="py-12 px-5 sm:px-6">
        <div className="max-w-2xl mx-auto space-y-6">

          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Serviços</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Seu catálogo. Cada serviço pode ser feito por mais de um profissional.
            </p>
          </div>

          {erro && <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl">{erro}</div>}

          {semProfissional.length > 0 && profissionais.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4 text-sm text-amber-700">
              {semProfissional.length === 1
                ? `"${semProfissional[0].nome}" não tem ninguém que o faça — `
                : `${semProfissional.length} serviços não têm ninguém que os faça — `}
              não aparecem para o cliente agendar.
            </div>
          )}

          {servicos.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
              <p className="text-sm text-gray-400">Nenhum serviço cadastrado ainda.</p>
            </div>
          )}

          {servicos.map(s => {
            const r = rascunho(s)
            const alterado = mudou(r, s)
            return (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <label className={labelClass}>Nome</label>
                    <input
                      type="text"
                      value={r.nome}
                      onChange={e => editar(s, { nome: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => remover(s)}
                    aria-label={`Remover ${s.nome}`}
                    className="text-gray-300 hover:text-red-500 transition-colors mt-6 shrink-0 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className={labelClass}>Duração</label>
                    <select
                      value={r.duracao}
                      onChange={e => editar(s, { duracao: e.target.value })}
                      className={`${inputClass} bg-white`}
                    >
                      {DURACOES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className={labelClass}>Preço</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={r.preco}
                      onChange={e => editar(s, { preco: e.target.value })}
                      placeholder="R$ —"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Quem faz este serviço</label>
                  <QuemFaz
                    profissionais={profissionais}
                    marcados={r.profissionaisIds}
                    onToggle={id => toggleProf(s, id)}
                  />
                </div>

                {(alterado || salvo === s.id) && (
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => salvar(s)}
                      disabled={salvando === s.id || !r.nome.trim()}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#25D366] hover:bg-[#128C7E] transition-colors disabled:opacity-50"
                    >
                      {salvando === s.id ? 'Salvando...' : 'Salvar'}
                    </button>
                    {alterado && (
                      <button
                        type="button"
                        onClick={() => setRascunhos(prev => { const p = { ...prev }; delete p[s.id]; return p })}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        Descartar
                      </button>
                    )}
                    {salvo === s.id && !alterado && (
                      <span className="text-xs text-[#128C7E] font-medium">Salvo</span>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Novo serviço */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <h2 className="text-xs uppercase tracking-widest font-semibold text-gray-500">
              Adicionar serviço
            </h2>

            <div>
              <label className={labelClass}>Nome</label>
              <input
                type="text"
                value={novo.nome}
                onChange={e => setNovo({ ...novo, nome: e.target.value })}
                placeholder="Ex: Corte masculino"
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); criar() } }}
                className={inputClass}
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className={labelClass}>Duração</label>
                <select
                  value={novo.duracao}
                  onChange={e => setNovo({ ...novo, duracao: e.target.value })}
                  className={`${inputClass} bg-white`}
                >
                  {DURACOES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className={labelClass}>Preço <span className="normal-case tracking-normal text-gray-300">(opcional)</span></label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={novo.preco}
                  onChange={e => setNovo({ ...novo, preco: e.target.value })}
                  placeholder="R$ —"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Quem faz este serviço</label>
              <QuemFaz
                profissionais={profissionais}
                marcados={novo.profissionaisIds}
                onToggle={id => setNovo(n => ({
                  ...n,
                  profissionaisIds: n.profissionaisIds.includes(id)
                    ? n.profissionaisIds.filter(x => x !== id)
                    : [...n.profissionaisIds, id],
                }))}
              />
            </div>

            <button
              type="button"
              onClick={criar}
              disabled={criando || !novo.nome.trim()}
              className="w-full py-3 rounded-xl text-sm font-semibold text-[#25D366] border-2 border-[#25D366] transition-all duration-200 hover:bg-[#dcfce7] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              {criando ? 'Adicionando...' : 'Adicionar serviço'}
            </button>
          </div>

        </div>
      </div>
    </SidebarLayout>
  )
}
