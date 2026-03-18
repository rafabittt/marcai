'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const TIPOS = [
  'Clínica',
  'Barbearia',
  'Salão de beleza',
  'Estúdio de tatuagem',
  'Nutricionista',
  'Psicólogo',
  'Personal trainer',
  'Loja',
  'Outro',
]


function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

type Negocio = {
  id: string
  nome: string
  tipo: string
  telefone: string
  slug: string
}

type Aba = 'perfil' | 'negocio'

export default function PerfilPage() {
  const [aba, setAba] = useState<Aba>('perfil')
  const [loading, setLoading] = useState(true)

  // Perfil
  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [savingPerfil, setSavingPerfil] = useState(false)
  const [sucessoPerfil, setSucessoPerfil] = useState(false)
  const [erroPerfil, setErroPerfil] = useState('')

  // Negócio
  const [negocio, setNegocio] = useState<Negocio | null>(null)
  const [negNome, setNegNome] = useState('')
  const [negTipo, setNegTipo] = useState(TIPOS[0])
  const [negTelefone, setNegTelefone] = useState('')
  const [negSlug, setNegSlug] = useState('')
  const [slugEditado, setSlugEditado] = useState(false)
  const [savingNeg, setSavingNeg] = useState(false)
  const [sucessoNeg, setSucessoNeg] = useState(false)
  const [erroNeg, setErroNeg] = useState('')

  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      setEmail(user.email ?? '')
      setNome(user.user_metadata?.full_name ?? '')
      setTelefone(user.user_metadata?.phone ?? '')

      const { data } = await supabase
        .from('negocios')
        .select('id, nome, tipo, telefone, slug')
        .eq('user_id', user.id)
        .maybeSingle()

      if (data) {
        setNegocio(data)
        setNegNome(data.nome)
        setNegTipo(data.tipo ?? TIPOS[0])
        setNegTelefone(data.telefone ?? '')
        setNegSlug(data.slug)
      }

      setLoading(false)
    }
    init()
  }, [])

  // ── Perfil handlers ──

  async function handleSalvarPerfil(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingPerfil(true)
    setSucessoPerfil(false)
    setErroPerfil('')

    const { error } = await supabase.auth.updateUser({
      data: { full_name: nome, phone: telefone },
    })

    if (error) setErroPerfil('Erro ao salvar. Tente novamente.')
    else setSucessoPerfil(true)
    setSavingPerfil(false)
  }

  // ── Negócio handlers ──

  function handleNegNomeChange(value: string) {
    setNegNome(value)
    if (!slugEditado) setNegSlug(toSlug(value))
  }

  function handleNegSlugChange(value: string) {
    setSlugEditado(true)
    setNegSlug(toSlug(value))
  }

  async function handleSalvarNegocio(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!negSlug) { setErroNeg('O slug não pode ficar vazio.'); return }

    setSavingNeg(true)
    setSucessoNeg(false)
    setErroNeg('')

    // Verifica unicidade do slug apenas se mudou
    if (negSlug !== negocio?.slug) {
      const { data: existing } = await supabase
        .from('negocios')
        .select('id')
        .eq('slug', negSlug)
        .maybeSingle()

      if (existing) {
        setErroNeg('Esse link já está em uso. Escolha outro slug.')
        setSavingNeg(false)
        return
      }
    }

    const { error } = await supabase
      .from('negocios')
      .update({ nome: negNome, tipo: negTipo, telefone: negTelefone, slug: negSlug })
      .eq('id', negocio!.id)

    if (error) setErroNeg('Erro ao salvar. Tente novamente.')
    else {
      setSucessoNeg(true)
      setNegocio(prev => prev ? { ...prev, nome: negNome, tipo: negTipo, telefone: negTelefone, slug: negSlug } : prev)
    }
    setSavingNeg(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f9f9f9' }}>
        <p className="text-gray-500 text-sm">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-14 px-6" style={{ background: '#f9f9f9' }}>
      <div className="max-w-lg mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Configurações</h1>
          <p className="text-gray-500 mt-1 text-sm">Gerencie seu perfil e seu negócio.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Abas */}
          <div className="flex border-b border-gray-100">
            {(['perfil', 'negocio'] as Aba[]).map((a) => (
              <button
                key={a}
                onClick={() => setAba(a)}
                className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                  aba === a ? 'text-[#25D366]' : 'text-gray-500 hover:text-gray-700'
                }`}
                style={aba === a ? { boxShadow: 'inset 0 -2px 0 #25D366' } : {}}
              >
                {a === 'perfil' ? 'Meu perfil' : 'Meu negócio'}
              </button>
            ))}
          </div>

          <div className="p-8">

            {/* ── ABA PERFIL ── */}
            {aba === 'perfil' && (
              <>
                {sucessoPerfil && (
                  <div className="bg-[#dcfce7] text-[#128C7E] text-sm px-4 py-3 rounded-xl mb-6">
                    Alterações salvas com sucesso.
                  </div>
                )}
                {erroPerfil && (
                  <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl mb-6">
                    {erroPerfil}
                  </div>
                )}

                <form onSubmit={handleSalvarPerfil} className="space-y-5">
                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-1.5 block">
                      Nome completo
                    </label>
                    <input
                      type="text"
                      value={nome}
                      onChange={e => { setNome(e.target.value); setSucessoPerfil(false) }}
                      placeholder="Rafael Oliveira"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                    />
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-1.5 block">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={telefone}
                      onChange={e => { setTelefone(e.target.value); setSucessoPerfil(false) }}
                      placeholder="(11) 99999-9999"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                    />
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-1.5 block">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      readOnly
                      className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-500 bg-gray-50 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1.5 ml-1">O email não pode ser alterado.</p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={savingPerfil}
                      className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-[#25D366] transition-all duration-200 hover:bg-[#128C7E] hover:scale-[1.02] disabled:opacity-50"
                    >
                      {savingPerfil ? 'Salvando...' : 'Salvar alterações'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* ── ABA NEGÓCIO ── */}
            {aba === 'negocio' && (
              <>
                {!negocio ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500 text-sm mb-6">
                      Você ainda não configurou seu negócio.
                    </p>
                    <Link
                      href="/login"
                      className="inline-block text-sm font-semibold px-6 py-3 rounded-xl text-white bg-[#25D366] transition-all duration-200 hover:bg-[#128C7E] hover:scale-[1.02]"
                    >
                      Configurar meu negócio
                    </Link>
                  </div>
                ) : (
                  <>
                    {sucessoNeg && (
                      <div className="bg-[#dcfce7] text-[#128C7E] text-sm px-4 py-3 rounded-xl mb-6">
                        Alterações salvas com sucesso.
                      </div>
                    )}
                    {erroNeg && (
                      <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl mb-6">
                        {erroNeg}
                      </div>
                    )}

                    <form onSubmit={handleSalvarNegocio} className="space-y-5">
                      <div>
                        <label className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-1.5 block">
                          Nome do negócio
                        </label>
                        <input
                          type="text"
                          value={negNome}
                          onChange={e => { handleNegNomeChange(e.target.value); setSucessoNeg(false) }}
                          required
                          placeholder="Barbearia do João"
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                        />
                      </div>

                      <div>
                        <label className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-1.5 block">
                          Tipo do negócio
                        </label>
                        <select
                          value={negTipo}
                          onChange={e => { setNegTipo(e.target.value); setSucessoNeg(false) }}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#25D366] bg-white"
                        >
                          {TIPOS.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-1.5 block">
                          Telefone / WhatsApp
                        </label>
                        <input
                          type="tel"
                          value={negTelefone}
                          onChange={e => { setNegTelefone(e.target.value); setSucessoNeg(false) }}
                          required
                          placeholder="(11) 99999-9999"
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                        />
                      </div>

                      <div>
                        <label className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-1.5 block">
                          Seu link público
                        </label>
                        <input
                          type="text"
                          value={negSlug}
                          onChange={e => { handleNegSlugChange(e.target.value); setSucessoNeg(false) }}
                          required
                          placeholder="barbearia-do-joao"
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                        />
                        {negSlug && (
                          <p className="mt-2 text-xs text-gray-500">
                            Seu link:{' '}
                            <span className="font-medium text-[#25D366]">
                              marcai.com.br/agendar/{negSlug}
                            </span>
                          </p>
                        )}
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={savingNeg}
                          className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-[#25D366] transition-all duration-200 hover:bg-[#128C7E] hover:scale-[1.02] disabled:opacity-50"
                        >
                          {savingNeg ? 'Salvando...' : 'Salvar alterações'}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
