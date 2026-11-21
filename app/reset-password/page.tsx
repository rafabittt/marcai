'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import LandingHeader from '../components/LandingHeader'

// Grafite: campo e rótulo vêm das peças prontas do globals.css.
const inputClass = 'field'
const labelClass = 'field-label'

export default function ResetPasswordPage() {
  const [initializing, setInitializing] = useState(true)
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    // Com fluxo PKCE, a sessão já foi estabelecida pelo callback server-side.
    // O evento PASSWORD_RECOVERY não dispara — basta checar se há sessão ativa.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
      setInitializing(false)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('Erro ao atualizar a senha. Tente solicitar um novo link.')
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 2000)
    }
  }

  return (
    <div className="min-h-screen">
      <LandingHeader />
      <div className="flex justify-center px-4 py-10 sm:py-14">
        <div className="card w-full max-w-[420px] !p-6 sm:!p-8">

          <div className="mb-6">
            <h1 className="t-title">Nova senha</h1>
            <p className="t-sub">
              Escolha uma nova senha para sua conta.
            </p>
          </div>

          {error && (
            <div className="note note-bad mb-5" role="alert">
              {error}
            </div>
          )}

          {success ? (
            <div className="note note-ok" role="status">
              <CheckCircle2 size={18} strokeWidth={1.8} className="flex-none mt-px" aria-hidden />
              <span>Senha atualizada com sucesso! Redirecionando...</span>
            </div>
          ) : initializing ? (
            <p className="t-cap !text-sm text-center py-4" role="status">
              Verificando link...
            </p>
          ) : !ready ? (
            <div className="note note-bad">
              <span>
                Link inválido ou expirado.{' '}
                <a href="/forgot-password" className="font-medium underline underline-offset-[3px]">
                  Solicitar novo link
                </a>
              </span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Nova senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={`${inputClass} pr-11`}
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="btn btn-ghost btn-icon btn-sm absolute right-1.5 top-1/2 -translate-y-1/2"
                    aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
                  </button>
                </div>
              </div>
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary btn-lg btn-block"
                >
                  {loading ? 'Salvando...' : 'Salvar nova senha'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}
