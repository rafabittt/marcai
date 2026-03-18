'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { maskCPF, maskName, maskPhone } from '@/lib/masks'

export default function PerfilPage() {
  const [loading, setLoading] = useState(true)

  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [cpf, setCpf] = useState('')
  const [saving, setSaving] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')

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
        .select('cpf')
        .eq('user_id', user.id)
        .maybeSingle()

      if (data) setCpf(data.cpf ?? '')
      setLoading(false)
    }
    init()
  }, [])

  async function handleSalvar(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setSucesso(false)
    setErro('')

    const { data: { user } } = await supabase.auth.getUser()

    const [authResult, negResult] = await Promise.all([
      supabase.auth.updateUser({ data: { full_name: nome, phone: telefone } }),
      user
        ? supabase.from('negocios').update({ cpf }).eq('user_id', user.id)
        : Promise.resolve({ error: null }),
    ])

    if (authResult.error || negResult.error) setErro('Erro ao salvar. Tente novamente.')
    else setSucesso(true)
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f9f9f9' }}>
        <p className="text-gray-500 text-sm">Carregando...</p>
      </div>
    )
  }

  const inputClass = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#25D366]'
  const labelClass = 'text-xs uppercase tracking-widest text-gray-500 font-medium mb-1.5 block'

  return (
    <div className="min-h-screen py-14 px-6" style={{ background: '#f9f9f9' }}>
      <div className="max-w-lg mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Meu perfil</h1>
          <p className="text-gray-500 mt-1 text-sm">Suas informações pessoais de acesso.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {sucesso && (
            <div className="bg-[#dcfce7] text-[#128C7E] text-sm px-4 py-3 rounded-xl mb-6">
              Alterações salvas com sucesso.
            </div>
          )}
          {erro && (
            <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl mb-6">
              {erro}
            </div>
          )}

          <form onSubmit={handleSalvar} className="space-y-5">
            <div>
              <label className={labelClass}>Nome completo</label>
              <input
                type="text"
                value={nome}
                onChange={e => { setNome(maskName(e.target.value)); setSucesso(false) }}
                placeholder="Rafael Oliveira"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Telefone pessoal</label>
              <input
                type="tel"
                value={telefone}
                onChange={e => { setTelefone(maskPhone(e.target.value)); setSucesso(false) }}
                placeholder="(11) 99999-9999"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>CPF</label>
              <input
                type="text"
                value={cpf}
                onChange={e => { setCpf(maskCPF(e.target.value)); setSucesso(false) }}
                placeholder="000.000.000-00"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Email</label>
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
                disabled={saving}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-[#25D366] transition-all duration-200 hover:bg-[#128C7E] hover:scale-[1.02] disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}
