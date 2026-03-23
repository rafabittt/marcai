'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import SidebarLayout from '@/app/components/SidebarLayout'
import { maskName } from '@/lib/masks'

type Profissional = {
  id: string
  negocio_id: string
  nome: string
  cargo: string
  foto_url: string | null
}

function getIniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length >= 2) return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  return partes[0]?.[0]?.toUpperCase() ?? '?'
}

const inputClass = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#25D366] placeholder-gray-300'
const labelClass = 'text-xs uppercase tracking-widest text-gray-500 font-medium mb-1.5 block'

export default function ProfissionaisPage() {
  const [loading, setLoading] = useState(true)
  const [negocioId, setNegocioId] = useState<string | null>(null)
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [nome, setNome] = useState('')
  const [cargo, setCargo] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [erro, setErro] = useState('')
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const { data: neg } = await supabase
        .from('negocios')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!neg) { setLoading(false); return }
      setNegocioId(neg.id)

      await carregarProfissionais(neg.id)
      setLoading(false)
    }
    init()
  }, [])

  async function carregarProfissionais(negId: string) {
    const { data, error } = await supabase
      .from('profissionais')
      .select('id, negocio_id, nome, cargo, foto_url')
      .eq('negocio_id', negId)
      .order('nome')
    if (error) {
      setErro('Erro ao carregar profissionais: ' + error.message)
      return
    }
    setProfissionais(data ?? [])
  }

  async function handleAdicionar(e: React.FormEvent) {
    e.preventDefault()
    if (!negocioId || !nome.trim()) return
    setSaving(true)
    setErro('')

    const { error } = await supabase.from('profissionais').insert({
      negocio_id: negocioId,
      nome: nome.trim(),
      cargo: cargo.trim(),
    })

    if (error) {
      setErro('Erro ao adicionar profissional.')
    } else {
      setNome('')
      setCargo('')
      await carregarProfissionais(negocioId)
    }
    setSaving(false)
  }

  async function handleRemover(id: string) {
    if (!negocioId) return
    await supabase.from('profissionais').delete().eq('id', id)
    setProfissionais(prev => prev.filter(p => p.id !== id))
  }

  async function handleUploadFoto(prof: Profissional, file: File) {
    setUploadingId(prof.id)
    setErro('')

    const ext = file.name.split('.').pop()
    const path = `${prof.negocio_id}/${prof.id}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('profissionais')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setErro('Erro ao fazer upload da foto.')
      setUploadingId(null)
      return
    }

    const { data: urlData } = supabase.storage.from('profissionais').getPublicUrl(path)
    const foto_url = urlData.publicUrl + `?t=${Date.now()}`

    await supabase.from('profissionais').update({ foto_url }).eq('id', prof.id)

    setProfissionais(prev =>
      prev.map(p => p.id === prof.id ? { ...p, foto_url } : p)
    )
    setUploadingId(null)
  }

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 text-sm">Carregando...</p>
        </div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout>
      <div className="py-14 px-6">
        <div className="max-w-2xl mx-auto space-y-8">

          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Profissionais</h1>
            <p className="text-gray-500 mt-1 text-sm">Gerencie sua equipe e fotos de perfil.</p>
          </div>

          {erro && (
            <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl">{erro}</div>
          )}

          {/* Lista de profissionais */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-4">
            <h2 className="text-xs uppercase tracking-widest font-semibold text-gray-500 mb-4">Equipe</h2>

            {profissionais.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum profissional cadastrado ainda.</p>
            )}

            {profissionais.map(prof => (
              <div key={prof.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                {/* Avatar */}
                <div className="relative shrink-0">
                  {prof.foto_url ? (
                    <img
                      src={prof.foto_url}
                      alt={prof.nome}
                      className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center text-white font-bold text-lg">
                      {getIniciais(prof.nome)}
                    </div>
                  )}
                  {/* Botão de upload sobreposto */}
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
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) handleUploadFoto(prof, file)
                      e.target.value = ''
                    }}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{prof.nome}</p>
                  {prof.cargo && (
                    <p className="text-xs text-gray-500 truncate">{prof.cargo}</p>
                  )}
                </div>

                {/* Remover */}
                <button
                  type="button"
                  onClick={() => handleRemover(prof.id)}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors shrink-0"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>

          {/* Formulário para adicionar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <h2 className="text-xs uppercase tracking-widest font-semibold text-gray-500 mb-6">Adicionar profissional</h2>
            <form onSubmit={handleAdicionar} className="space-y-4">
              <div>
                <label className={labelClass}>Nome</label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(maskName(e.target.value))}
                  placeholder="Maria Silva"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Cargo / Especialidade</label>
                <input
                  type="text"
                  value={cargo}
                  onChange={e => setCargo(e.target.value)}
                  placeholder="Ex: Esteticista, Barbeiro..."
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl text-sm font-semibold text-[#25D366] border-2 border-[#25D366] transition-all duration-200 hover:bg-[#dcfce7] hover:scale-[1.02] disabled:opacity-50"
              >
                {saving ? 'Adicionando...' : '+ Adicionar'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </SidebarLayout>
  )
}
