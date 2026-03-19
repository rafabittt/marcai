'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import LandingHeader from '../components/LandingHeader'

const inputClass = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#25D366] placeholder-gray-300'
const labelClass = 'text-xs uppercase tracking-widest text-gray-500 font-medium mb-1.5 block'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError('Erro ao enviar o e-mail. Verifique o endereço e tente novamente.')
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LandingHeader />
      <div className="flex items-center justify-center px-4 py-12">
        <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">

          <div className="mb-8">
            <h1 className="text-xl font-semibold text-gray-900 mb-1">Recuperar senha</h1>
            <p className="text-sm text-gray-500">
              Informe seu e-mail e enviaremos um link para redefinir sua senha.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl mb-5">
              {error}
            </div>
          )}

          {sent ? (
            <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl">
              E-mail enviado! Verifique sua caixa de entrada e siga o link para redefinir sua senha.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-[#25D366] transition-all duration-200 hover:bg-[#128C7E] hover:scale-[1.02] disabled:opacity-50"
                >
                  {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-5 text-center">
            <a
              href="/login"
              className="text-sm font-medium text-[#25D366] hover:underline transition-all duration-200"
            >
              Voltar para o login
            </a>
          </div>

        </div>
      </div>
    </div>
  )
}
