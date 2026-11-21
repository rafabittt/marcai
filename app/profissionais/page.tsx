'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import SidebarLayout from '@/app/components/SidebarLayout'
import Carregando from '@/app/components/Carregando'
import { maskName } from '@/lib/masks'
import { formatarPreco } from '@/lib/preco'
import { Camera, Plus, Trash2, Users, X } from 'lucide-react'

type Servico     = { id: string; nome: string; duracao: string; preco: number | null }
type Profissional = { id: string; negocio_id: string; nome: string; cargo: string; foto_url: string | null; servicos: Servico[] }

function getIniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length >= 2) return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  return partes[0]?.[0]?.toUpperCase() ?? '?'
}

export default function ProfissionaisPage() {
  const [loading,      setLoading]      = useState(true)
  const [negocioId,    setNegocioId]    = useState<string | null>(null)
  const [plano,        setPlano]        = useState('gratuito')
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [erro,         setErro]         = useState('')

  const [nome,  setNome]  = useState('')
  const [cargo, setCargo] = useState('')
  const [saving, setSaving] = useState(false)

  const [uploadingId,   setUploadingId]   = useState<string | null>(null)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // ── Estado só de tela (não toca em dados) ──
  // A janela "Novo profissional" guarda quantos profissionais havia quando
  // abriu. Quando o novo entra na lista (handleAdicionar recarrega), a conta
  // muda e a janela fecha sozinha — sem mexer na lógica de adicionar.
  const [novoAbertoCom, setNovoAbertoCom] = useState<number | null>(null)
  const janelaNova = novoAbertoCom !== null && profissionais.length === novoAbertoCom

  // Janela por cima fecha no Esc.
  useEffect(() => {
    if (!janelaNova) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setNovoAbertoCom(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [janelaNova])

  function abrirNovo() {
    setErro('')
    setNovoAbertoCom(profissionais.length)
  }

  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const { data: neg } = await supabase
        .from('negocios').select('id, plano').eq('user_id', user.id).maybeSingle()

      if (!neg) { setLoading(false); return }
      setNegocioId(neg.id)
      setPlano(neg.plano ?? 'gratuito')
      await carregarDados(neg.id)
      setLoading(false)
    }
    init()
  }, [])

  async function carregarDados(negId: string) {
    const [{ data: profData }, { data: srvData }] = await Promise.all([
      supabase.from('profissionais').select('id, negocio_id, nome, cargo, foto_url').eq('negocio_id', negId).order('nome'),
      supabase.from('servicos').select('id, nome, duracao, preco').eq('negocio_id', negId).order('nome'),
    ])
    const servicos = srvData ?? []

    // Quem faz o quê vem da junção, não mais de servicos.profissional_id: um
    // serviço pode ser feito por vários profissionais.
    const { data: vinc } = servicos.length
      ? await supabase.from('servico_profissional')
          .select('servico_id, profissional_id')
          .in('servico_id', servicos.map(s => s.id))
      : { data: [] as { servico_id: string; profissional_id: string }[] }

    setProfissionais((profData ?? []).map(p => ({
      ...p,
      servicos: (vinc ?? [])
        .filter(v => v.profissional_id === p.id)
        .map(v => servicos.find(s => s.id === v.servico_id))
        .filter((s): s is Servico => s !== undefined),
    })))
  }

  const limiteProf = plano === 'prime' ? Infinity : plano === 'pro' ? 3 : 1

  async function handleAdicionar(e: React.FormEvent) {
    e.preventDefault()
    if (!negocioId || !nome.trim()) return
    setSaving(true)
    setErro('')

    if (profissionais.length >= limiteProf) {
      const label = plano === 'pro' ? '3 profissionais' : '1 profissional'
      setErro(`Seu plano ${plano.charAt(0).toUpperCase() + plano.slice(1)} permite até ${label}. Faça upgrade para adicionar mais.`)
      setSaving(false)
      return
    }

    const { error } = await supabase.from('profissionais').insert({
      negocio_id: negocioId, nome: nome.trim(), cargo: cargo.trim(),
    })

    if (error) {
      setErro('Erro ao adicionar profissional.')
    } else {
      setNome(''); setCargo('')
      await carregarDados(negocioId)
    }
    setSaving(false)
  }

  async function handleRemover(id: string) {
    // A janela "Novo profissional" fecha quando a lista cresce (ver janelaNova).
    // Esquece o tamanho guardado, senão apagar um item a faria reabrir sozinha.
    setNovoAbertoCom(null)
    await supabase.from('profissionais').delete().eq('id', id)
    setProfissionais(prev => prev.filter(p => p.id !== id))
  }

  async function handleUploadFoto(prof: Profissional, file: File) {
    setUploadingId(prof.id)
    const ext = file.name.split('.').pop()
    const path = `${prof.negocio_id}/${prof.id}.${ext}`
    const { error: uploadError } = await supabase.storage.from('profissionais').upload(path, file, { upsert: true })
    if (uploadError) { setErro('Erro ao fazer upload da foto.'); setUploadingId(null); return }
    const { data: urlData } = supabase.storage.from('profissionais').getPublicUrl(path)
    const foto_url = urlData.publicUrl + `?t=${Date.now()}`
    await supabase.from('profissionais').update({ foto_url }).eq('id', prof.id)
    setProfissionais(prev => prev.map(p => p.id === prof.id ? { ...p, foto_url } : p))
    setUploadingId(null)
  }

  if (loading) {
    return (
      <SidebarLayout>
        <Carregando />
      </SidebarLayout>
    )
  }

  const nomePlano = plano.charAt(0).toUpperCase() + plano.slice(1)

  return (
    <SidebarLayout>
      <main className="page page-narrow">

        <div className="page-head">
          <div className="min-w-0">
            <h1 className="t-title">Profissionais</h1>
            <p className="t-sub">
              Sua equipe. Os serviços ficam no{' '}
              <Link href="/servicos" className="link">catálogo</Link>.
            </p>
          </div>
          <span className="flex-1" />
          <button type="button" onClick={abrirNovo} className="btn btn-primary">
            <Plus size={16} strokeWidth={2} aria-hidden />
            Novo profissional
          </button>
        </div>

        <div className="space-y-[14px]">
          {erro && !janelaNova && <div className="note note-bad" role="alert">{erro}</div>}

          {profissionais.length === 0 ? (
            <section className="card empty">
              <div className="tile-ico mb-2"><Users size={18} strokeWidth={1.8} /></div>
              <p className="t-cap mb-3">Nenhum profissional cadastrado ainda.</p>
              <button type="button" onClick={abrirNovo} className="btn">
                <Plus size={16} strokeWidth={1.8} aria-hidden />
                Adicionar profissional
              </button>
            </section>
          ) : (
            <section className="card !py-2">
              <ul className="list">
                {profissionais.map(prof => (
                  <li key={prof.id} className="list-row !items-start !py-4">

                    {/* Foto: o avatar inteiro é o botão de trocar */}
                    <button
                      type="button"
                      onClick={() => fileRefs.current[prof.id]?.click()}
                      disabled={uploadingId === prof.id}
                      aria-label={`Trocar foto de ${prof.nome}`}
                      title="Trocar foto"
                      className="relative shrink-0 rounded-full disabled:opacity-50"
                    >
                      {prof.foto_url ? (
                        <img src={prof.foto_url} alt="" className="w-11 h-11 rounded-full object-cover" />
                      ) : (
                        <span className="avatar !w-11 !h-11 !text-[15px]">{getIniciais(prof.nome)}</span>
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-surface border border-hairline shadow-soft grid place-items-center text-muted">
                        {uploadingId === prof.id
                          ? <span className="text-[8px] leading-none">...</span>
                          : <Camera size={11} strokeWidth={1.8} />}
                      </span>
                    </button>
                    <input
                      ref={el => { fileRefs.current[prof.id] = el }}
                      type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadFoto(prof, f); e.target.value = '' }}
                    />

                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-medium text-fg truncate">{prof.nome}</p>
                      {prof.cargo && <p className="t-cap truncate">{prof.cargo}</p>}

                      {/* Serviços — somente leitura. O catálogo e a atribuição de
                          quem faz cada serviço vivem em /servicos: um serviço pode ser
                          feito por vários profissionais, então editar daqui, de dentro
                          de um deles, seria ambíguo. */}
                      <div className="mt-3">
                        <div className="flex items-baseline justify-between gap-3 mb-2">
                          <p className="t-label">Faz estes serviços</p>
                          <Link href="/servicos" className="link text-[13px] shrink-0">
                            Editar no catálogo
                          </Link>
                        </div>

                        {prof.servicos.length === 0 ? (
                          <p className="t-cap">
                            Nenhum serviço atribuído.{' '}
                            <Link href="/servicos" className="link">
                              Atribua no catálogo
                            </Link>{' '}
                            para {prof.nome.split(' ')[0]} aparecer no agendamento.
                          </p>
                        ) : (
                          <ul className="flex flex-wrap gap-1.5" aria-label="Faz estes serviços">
                            {prof.servicos.map(s => (
                              <li
                                key={s.id}
                                className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-tag bg-fill text-[12px]"
                              >
                                <span className="font-medium text-fg">{s.nome}</span>
                                <span className="text-muted">{s.duracao}</span>
                                {s.preco !== null && (
                                  <span className="text-muted tabular">{formatarPreco(s.preco)}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemover(prof.id)}
                      aria-label={`Remover ${prof.nome}`}
                      title="Remover"
                      className="btn btn-ghost btn-icon btn-sm shrink-0 hover:text-bad-ink hover:bg-bad-bg"
                    >
                      <Trash2 size={15} strokeWidth={1.8} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {profissionais.length >= limiteProf && plano !== 'prime' && (
            <div className="note">
              <span>
                Limite de profissionais atingido para o plano {nomePlano}.{' '}
                <a href="/plano" className="link">Fazer upgrade</a>
              </span>
            </div>
          )}
        </div>
      </main>

      {/* ── Janela "Novo profissional" ── */}
      {janelaNova && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 text-fg">
          <div className="scrim" onClick={() => setNovoAbertoCom(null)} />
          <div role="dialog" aria-modal="true" aria-labelledby="novo-prof-titulo" className="sheet relative w-full max-w-md p-6 sm:p-7">
            <button
              type="button"
              onClick={() => setNovoAbertoCom(null)}
              aria-label="Fechar"
              className="btn btn-ghost btn-icon btn-sm absolute top-4 right-4"
            >
              <X size={18} />
            </button>

            <h2 id="novo-prof-titulo" className="t-section mb-5 pr-8">Adicionar profissional</h2>

            <form onSubmit={handleAdicionar} className="space-y-4">
              {erro && <div className="note note-bad" role="alert">{erro}</div>}
              <div>
                <label htmlFor="prof-nome" className="field-label">Nome</label>
                <input id="prof-nome" type="text" value={nome} onChange={e => setNome(maskName(e.target.value))} placeholder="Maria Silva" required autoFocus className="field" />
              </div>
              <div>
                <label htmlFor="prof-cargo" className="field-label">Cargo / Especialidade</label>
                <input id="prof-cargo" type="text" value={cargo} onChange={e => setCargo(e.target.value)} placeholder="Ex: Esteticista, Barbeiro..." className="field" />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary btn-lg btn-block !mt-6"
              >
                <Plus size={16} strokeWidth={2} aria-hidden />
                {saving ? 'Adicionando...' : 'Adicionar profissional'}
              </button>
            </form>
          </div>
        </div>
      )}
    </SidebarLayout>
  )
}
