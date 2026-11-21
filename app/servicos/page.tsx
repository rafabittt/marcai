'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import SidebarLayout from '@/app/components/SidebarLayout'
import Carregando from '@/app/components/Carregando'
import { parsePreco, precoParaInput, formatarPreco } from '@/lib/preco'
import { Check, Trash2, Plus, Pencil, X, Scissors } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Catálogo de serviços.
//
// Serviço é a entidade do catálogo, não algo que pertence a um profissional —
// numa barbearia com três barbeiros, os três fazem o mesmo corte. Quem executa
// vive na junção servico_profissional, e a atribuição é feita aqui, como em
// Fresha e GoDaddy.
//
// servicos.profissional_id é legado e NÃO é mais lida por ninguém — tudo lê a
// junção. Continua sendo gravada, com o primeiro profissional marcado, só como
// rede de segurança: enquanto a coluna existir, um rollback de deploy para o
// código antigo ainda encontra o vínculo. Some junto com a coluna, num passo
// separado.
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
      <p className="t-cap">
        Nenhum profissional cadastrado ainda —{' '}
        <a href="/profissionais" className="link">cadastre a equipe</a>{' '}
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
            className={`btn btn-sm ${on
              ? 'bg-ink text-ink-text border-transparent hover:border-transparent'
              : 'text-muted hover:text-fg'}`}
          >
            {on && <Check size={13} strokeWidth={2.2} aria-hidden />}
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

  // ── Estado só de tela (não toca em dados) ──
  // Qual linha está aberta para edição. Os rascunhos continuam guardados
  // mesmo com a linha fechada, como antes.
  const [aberto, setAberto] = useState<string | null>(null)
  // A janela "Novo serviço" guarda quantos serviços havia quando abriu. Quando
  // o serviço novo entra na lista (criar() recarrega), a conta muda e a janela
  // fecha sozinha — sem mexer na lógica de criar().
  const [novoAbertoCom, setNovoAbertoCom] = useState<number | null>(null)

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
      // Coluna legada, mantida em sincronia só para um eventual rollback.
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
    // Apagar não tem volta: confirma antes (antes apagava no primeiro toque).
    if (!window.confirm(`Remover o serviço "${s.nome}"? Isso não pode ser desfeito.`)) return
    setErro('')
    // A janela "Novo serviço" fecha quando a lista cresce (ver janelaNova).
    // Esquece o tamanho guardado, senão apagar um item a faria reabrir sozinha.
    setNovoAbertoCom(null)
    // A junção tem ON DELETE CASCADE — os vínculos somem junto.
    const { error } = await supabase.from('servicos').delete().eq('id', s.id)
    if (error) { setErro('Erro ao remover o serviço. Tente novamente.'); return }
    setServicos(prev => prev.filter(x => x.id !== s.id))
  }

  const semProfissional = useMemo(
    () => servicos.filter(s => s.profissionaisIds.length === 0),
    [servicos],
  )

  const janelaNova = novoAbertoCom !== null && servicos.length === novoAbertoCom

  // Janela por cima fecha no Esc.
  useEffect(() => {
    if (!janelaNova) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setNovoAbertoCom(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [janelaNova])

  function abrirNovo() {
    setErro('')
    setNovoAbertoCom(servicos.length)
  }

  /** Nomes de quem faz, para a linha de detalhe da lista. */
  function nomesDe(ids: string[]): string {
    return profissionais.filter(p => ids.includes(p.id)).map(p => p.nome).join(', ')
  }

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
            <h1 className="t-title">Serviços</h1>
            <p className="t-sub">
              Seu catálogo. Cada serviço pode ser feito por mais de um profissional.
            </p>
          </div>
          <span className="flex-1" />
          <button type="button" onClick={abrirNovo} className="btn btn-primary">
            <Plus size={16} strokeWidth={2} aria-hidden />
            Novo serviço
          </button>
        </div>

        <div className="space-y-[14px]">
          {erro && !janelaNova && <div className="note note-bad" role="alert">{erro}</div>}

          {semProfissional.length > 0 && profissionais.length > 0 && (
            <div className="note">
              <span>
                {semProfissional.length === 1
                  ? `"${semProfissional[0].nome}" não tem ninguém que o faça — `
                  : `${semProfissional.length} serviços não têm ninguém que os faça — `}
                não aparecem para o cliente agendar.
              </span>
            </div>
          )}

          {servicos.length === 0 ? (
            <section className="card empty">
              <div className="tile-ico mb-2"><Scissors size={18} strokeWidth={1.8} /></div>
              <p className="t-cap mb-3">Nenhum serviço cadastrado ainda.</p>
              <button type="button" onClick={abrirNovo} className="btn">
                <Plus size={16} strokeWidth={1.8} aria-hidden />
                Adicionar serviço
              </button>
            </section>
          ) : (
            <section className="card !py-2">
              <ul className="list">
                {servicos.map(s => {
                  const r = rascunho(s)
                  const alterado = mudou(r, s)
                  const estaAberto = aberto === s.id
                  const quem = nomesDe(s.profissionaisIds)
                  return (
                    <li key={s.id} className="border-t border-hairline first:border-t-0">
                      <div className="list-row">
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-medium text-fg truncate">{s.nome}</p>
                          <p className="t-cap truncate">
                            {s.duracao}{quem ? ` · ${quem}` : ''}
                          </p>
                        </div>
                        {s.preco !== null && (
                          <span className="text-[14px] font-medium text-fg tabular whitespace-nowrap">
                            {formatarPreco(s.preco)}
                          </span>
                        )}
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setAberto(estaAberto ? null : s.id)}
                            aria-expanded={estaAberto}
                            aria-label={`Editar ${s.nome}`}
                            className={`btn btn-ghost btn-icon btn-sm ${estaAberto ? 'bg-fill text-fg' : ''}`}
                          >
                            <Pencil size={15} strokeWidth={1.8} />
                          </button>
                          <button
                            type="button"
                            onClick={() => remover(s)}
                            aria-label={`Remover ${s.nome}`}
                            className="btn btn-ghost btn-icon btn-sm hover:text-bad-ink hover:bg-bad-bg"
                          >
                            <Trash2 size={15} strokeWidth={1.8} />
                          </button>
                        </div>
                      </div>

                      {/* Edição na própria linha: mesmos rascunhos de antes. */}
                      {estaAberto && (
                        <div className="pb-4 pt-1 space-y-4">
                          <div>
                            <label htmlFor={`nome-${s.id}`} className="field-label">Nome</label>
                            <input
                              id={`nome-${s.id}`}
                              type="text"
                              value={r.nome}
                              onChange={e => editar(s, { nome: e.target.value })}
                              className="field"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label htmlFor={`duracao-${s.id}`} className="field-label">Duração</label>
                              <select
                                id={`duracao-${s.id}`}
                                value={r.duracao}
                                onChange={e => editar(s, { duracao: e.target.value })}
                                className="field"
                              >
                                {DURACOES.map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                            </div>
                            <div>
                              <label htmlFor={`preco-${s.id}`} className="field-label">Preço</label>
                              <input
                                id={`preco-${s.id}`}
                                type="text"
                                inputMode="decimal"
                                value={r.preco}
                                onChange={e => editar(s, { preco: e.target.value })}
                                placeholder="R$ —"
                                className="field tabular"
                              />
                            </div>
                          </div>

                          <div>
                            <p className="field-label">Quem faz este serviço</p>
                            <QuemFaz
                              profissionais={profissionais}
                              marcados={r.profissionaisIds}
                              onToggle={id => toggleProf(s, id)}
                            />
                          </div>

                          {(alterado || salvo === s.id) && (
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => salvar(s)}
                                disabled={salvando === s.id || !r.nome.trim()}
                                className="btn btn-primary btn-sm"
                              >
                                {salvando === s.id ? 'Salvando...' : 'Salvar'}
                              </button>
                              {alterado && (
                                <button
                                  type="button"
                                  onClick={() => setRascunhos(prev => { const p = { ...prev }; delete p[s.id]; return p })}
                                  className="btn btn-ghost btn-sm"
                                >
                                  Descartar
                                </button>
                              )}
                              {salvo === s.id && !alterado && (
                                <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ok-ink" role="status">
                                  <Check size={14} strokeWidth={2} aria-hidden />
                                  Salvo
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </div>
      </main>

      {/* ── Janela "Novo serviço" ── */}
      {janelaNova && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 text-fg">
          <div className="scrim" onClick={() => setNovoAbertoCom(null)} />
          <div role="dialog" aria-modal="true" aria-labelledby="novo-servico-titulo" className="sheet relative w-full max-w-md p-6 sm:p-7 max-h-[90dvh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setNovoAbertoCom(null)}
              aria-label="Fechar"
              className="btn btn-ghost btn-icon btn-sm absolute top-4 right-4"
            >
              <X size={18} />
            </button>

            <h2 id="novo-servico-titulo" className="t-section mb-5 pr-8">Adicionar serviço</h2>

            <div className="space-y-4">
              {erro && <div className="note note-bad" role="alert">{erro}</div>}

              <div>
                <label htmlFor="novo-nome" className="field-label">Nome</label>
                <input
                  id="novo-nome"
                  type="text"
                  value={novo.nome}
                  onChange={e => setNovo({ ...novo, nome: e.target.value })}
                  placeholder="Ex: Corte masculino"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); criar() } }}
                  autoFocus
                  className="field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="novo-duracao" className="field-label">Duração</label>
                  <select
                    id="novo-duracao"
                    value={novo.duracao}
                    onChange={e => setNovo({ ...novo, duracao: e.target.value })}
                    className="field"
                  >
                    {DURACOES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="novo-preco" className="field-label">
                    Preço <span className="text-faint font-normal">(opcional)</span>
                  </label>
                  <input
                    id="novo-preco"
                    type="text"
                    inputMode="decimal"
                    value={novo.preco}
                    onChange={e => setNovo({ ...novo, preco: e.target.value })}
                    placeholder="R$ —"
                    className="field tabular"
                  />
                </div>
              </div>

              <div>
                <p className="field-label">Quem faz este serviço</p>
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
                className="btn btn-primary btn-lg btn-block !mt-6"
              >
                <Plus size={16} strokeWidth={2} aria-hidden />
                {criando ? 'Adicionando...' : 'Adicionar serviço'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  )
}
