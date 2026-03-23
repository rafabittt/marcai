'use client'

import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import LandingHeader from '../components/LandingHeader'

const inputClass = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#25D366] placeholder-gray-300'
const labelClass = 'text-xs uppercase tracking-widest text-gray-500 font-medium mb-1.5 block'

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
    <div className="min-h-screen bg-gray-50">
      <LandingHeader />
      <div className="flex items-center justify-center px-4 py-12">
        <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">

          <div className="mb-8">
            <h1 className="text-xl font-semibold text-gray-900 mb-1">Nova senha</h1>
            <p className="text-sm text-gray-500">
              Escolha uma nova senha para sua conta.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl mb-5">
              {error}
            </div>
          )}

          {success ? (
            <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl">
              Senha atualizada com sucesso! Redirecionando...
            </div>
          ) : initializing ? (
            <div className="text-sm text-gray-500 text-center py-4">
              Verificando link...
            </div>
          ) : !ready ? (
            <div className="text-sm text-gray-500 text-center py-4">
              Link inválido ou expirado.{' '}
              <a href="/forgot-password" className="text-[#25D366] hover:underline font-medium">
                Solicitar novo link
              </a>
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
                    className={inputClass}
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-[#25D366] transition-all duration-200 hover:bg-[#128C7E] hover:scale-[1.02] disabled:opacity-50"
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
