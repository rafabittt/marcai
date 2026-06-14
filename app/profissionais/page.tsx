'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import SidebarLayout from '@/app/components/SidebarLayout'
import GooLoader from '@/app/components/GooLoader'
import { maskName } from '@/lib/masks'

const DURACOES = ['15 min', '30 min', '45 min', '1h', '1h 30min', '2h', '2h 30min', '3h']

type Servico     = { id: string; nome: string; duracao: string; profissional_id: string }
type Profissional = { id: string; negocio_id: string; nome: string; cargo: string; foto_url: string | null; servicos: Servico[] }

function getIniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length >= 2) return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  return partes[0]?.[0]?.toUpperCase() ?? '?'
}

const inputClass = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#25D366] placeholder-gray-300'
const labelClass = 'text-xs uppercase tracking-widest text-gray-500 font-medium mb-1.5 block'

export default function ProfissionaisPage() {
  const [loading,      setLoading]      = useState(true)
  const [negocioId,    setNegocioId]    = useState<string | null>(null)
  const [plano,        setPlano]        = useState('gratuito')
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [erro,         setErro]         = useState('')

  const [nome,  setNome]  = useState('')
  const [cargo, setCargo] = useState('')
  const [saving, setSaving] = useState(false)

  const [novoServico,   setNovoServico]   = useState<Record<string, { nome: string; duracao: string }>>({})
  const [savingServico, setSavingServico] = useState<string | null>(null)
  const [uploadingId,   setUploadingId]   = useState<string | null>(null)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

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
      supabase.from('servicos').select('id, nome, duracao, profissional_id').eq('negocio_id', negId),
    ])
    const servicos = srvData ?? []
    setProfissionais((profData ?? []).map(p => ({
      ...p,
      servicos: servicos.filter(s => s.profissional_id === p.id),
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
    await supabase.from('profissionais').delete().eq('id', id)
    setProfissionais(prev => prev.filter(p => p.id !== id))
  }

  async function handleAdicionarServico(profId: string) {
    if (!negocioId) return
    const form = novoServico[profId] ?? { nome: '', duracao: '30 min' }
    if (!form.nome.trim()) return
    setSavingServico(profId)

    const { error } = await supabase.from('servicos').insert({
      negocio_id: negocioId,
      profissional_id: profId,
      nome: form.nome.trim(),
      duracao: form.duracao,
    })

    if (!error) {
      setNovoServico(prev => ({ ...prev, [profId]: { nome: '', duracao: '30 min' } }))
      await carregarDados(negocioId)
    }
    setSavingServico(null)
  }

  async function handleRemoverServico(servicoId: string, profId: string) {
    await supabase.from('servicos').delete().eq('id', servicoId)
    setProfissionais(prev => prev.map(p =>
      p.id === profId ? { ...p, servicos: p.servicos.filter(s => s.id !== servicoId) } : p
    ))
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
        <div className="flex items-center justify-center h-64"><GooLoader /></div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout>
      <div className="py-14 px-6">
        <div className="max-w-2xl mx-auto space-y-8">

          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Profissionais & Serviços</h1>
            <p className="text-gray-500 mt-1 text-sm">Gerencie sua equipe e os serviços de cada profissional.</p>
          </div>

          {erro && <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl">{erro}</div>}

          {profissionais.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <p className="text-sm text-gray-400">Nenhum profissional cadastrado ainda.</p>
            </div>
          )}

          {profissionais.map(prof => {
            const form = novoServico[prof.id] ?? { nome: '', duracao: '30 min' }
            return (
              <div key={prof.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

                {/* Header do profissional */}
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    {prof.foto_url ? (
                      <img src={prof.foto_url} alt={prof.nome} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center text-white font-bold text-lg">
                        {getIniciais(prof.nome)}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileRefs.current[prof.id]?.click()}
                      disabled={uploadingId === prof.id}
                      className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                      title="Trocar foto"
                    >
                      {uploadingId === prof.id ? (
                        <span className="text-[8px] text-gray-400">...</span>
                      ) : (
                        <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                    <input
                      ref={el => { fileRefs.current[prof.id] = el }}
                      type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadFoto(prof, f); e.target.value = '' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{prof.nome}</p>
                    {prof.cargo && <p className="text-xs text-gray-500">{prof.cargo}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemover(prof.id)}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors shrink-0"
                  >
                    Remover
                  </button>
                </div>

                {/* Serviços */}
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-3">Serviços</p>

                  {prof.servicos.length === 0 && (
                    <p className="text-xs text-gray-400 mb-3">Nenhum serviço cadastrado para este profissional.</p>
                  )}

                  <div className="space-y-2 mb-3">
                    {prof.servicos.map(s => (
                      <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{s.nome}</p>
                          <p className="text-xs text-gray-500">{s.duracao}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoverServico(s.id, prof.id)}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors ml-4 shrink-0"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.nome}
                      onChange={e => setNovoServico(prev => ({ ...prev, [prof.id]: { ...form, nome: e.target.value } }))}
                      placeholder="Nome do serviço"
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdicionarServico(prof.id) } }}
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#25D366] placeholder-gray-300"
                    />
                    <select
                      value={form.duracao}
                      onChange={e => setNovoServico(prev => ({ ...prev, [prof.id]: { ...form, duracao: e.target.value } }))}
                      className="w-28 border border-gray-200 rounded-xl px-2 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#25D366] bg-white"
                    >
                      {DURACOES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleAdicionarServico(prof.id)}
                      disabled={savingServico === prof.id || !form.nome.trim()}
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#25D366] hover:bg-[#128C7E] transition-colors disabled:opacity-50 shrink-0"
                    >
                      {savingServico === prof.id ? '...' : '+ Add'}
                    </button>
                  </div>
                </div>

              </div>
            )
          })}

          {profissionais.length >= limiteProf && plano !== 'prime' && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4 text-sm text-amber-700">
              Limite de profissionais atingido para o plano {plano.charAt(0).toUpperCase() + plano.slice(1)}.{' '}
              <a href="/plano" className="underline font-semibold hover:text-amber-900">Fazer upgrade</a>
            </div>
          )}

          {/* Formulário adicionar profissional */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <h2 className="text-xs uppercase tracking-widest font-semibold text-gray-500 mb-6">Adicionar profissional</h2>
            <form onSubmit={handleAdicionar} className="space-y-4">
              <div>
                <label className={labelClass}>Nome</label>
                <input type="text" value={nome} onChange={e => setNome(maskName(e.target.value))} placeholder="Maria Silva" required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Cargo / Especialidade</label>
                <input type="text" value={cargo} onChange={e => setCargo(e.target.value)} placeholder="Ex: Esteticista, Barbeiro..." className={inputClass} />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl text-sm font-semibold text-[#25D366] border-2 border-[#25D366] transition-all duration-200 hover:bg-[#dcfce7] hover:scale-[1.02] disabled:opacity-50"
              >
                {saving ? 'Adicionando...' : '+ Adicionar profissional'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </SidebarLayout>
  )
}
