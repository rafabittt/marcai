'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { maskCPF, maskName, maskPhone } from '@/lib/masks'
import SidebarLayout from '@/app/components/SidebarLayout'
import Carregando from '@/app/components/Carregando'
import { CheckCircle2 } from 'lucide-react'

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
      <SidebarLayout>
        <Carregando />
      </SidebarLayout>
    )
  }

  // Grafite: campo e rótulo vêm das peças prontas do globals.css.
  const inputClass = 'field'
  const labelClass = 'field-label'

  return (
    <SidebarLayout>
      <main className="page page-narrow">

        <div className="page-head">
          <div>
            <h1 className="t-title">Meu perfil</h1>
            <p className="t-sub">Suas informações pessoais de acesso.</p>
          </div>
        </div>

        <section className="card !p-6 sm:!p-7">
          {sucesso && (
            <div className="note note-ok mb-5" role="status">
              <CheckCircle2 size={18} strokeWidth={1.8} className="flex-none mt-px" aria-hidden />
              <span>Alterações salvas com sucesso.</span>
            </div>
          )}
          {erro && (
            <div className="note note-bad mb-5" role="alert">
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
                className={`${inputClass} tabular`}
              />
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={email}
                readOnly
                className={`${inputClass} !bg-fill !text-muted !border-hairline cursor-not-allowed`}
              />
              <p className="field-hint">O email não pode ser alterado.</p>
            </div>

            <div className="pt-1 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary btn-lg w-full sm:w-auto"
              >
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        </section>

      </main>
    </SidebarLayout>
  )
}
