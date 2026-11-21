'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import LandingHeader from '../components/LandingHeader'

// Grafite: campo e rótulo vêm das peças prontas do globals.css.
const inputClass = 'field'
const labelClass = 'field-label'

function ForgotPasswordContent() {
  const searchParams = useSearchParams()
  const linkExpirado = searchParams.get('erro') === 'link_expirado'

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(linkExpirado ? 'O link expirou ou já foi usado. Solicite um novo abaixo.' : '')
  const [sent, setSent] = useState(false)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
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
    <div className="min-h-screen">
      <LandingHeader />
      <div className="flex justify-center px-4 py-10 sm:py-14">
        <div className="card w-full max-w-[420px] !p-6 sm:!p-8">

          <div className="mb-6">
            <h1 className="t-title">Recuperar senha</h1>
            <p className="t-sub">
              Informe seu e-mail e enviaremos um link para redefinir sua senha.
            </p>
          </div>

          {error && (
            <div className="note note-bad mb-5" role="alert">
              {error}
            </div>
          )}

          {sent ? (
            <div className="note note-ok" role="status">
              <CheckCircle2 size={18} strokeWidth={1.8} className="flex-none mt-px" aria-hidden />
              <span>E-mail enviado! Verifique sua caixa de entrada e siga o link para redefinir sua senha.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="esq-1" className={labelClass}>Email</label>
                <input id="esq-1"
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
                  className="btn btn-primary btn-lg btn-block"
                >
                  {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-5 text-center">
            <a
              href="/login"
              className="link text-sm"
            >
              Voltar para o login
            </a>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordContent />
    </Suspense>
  )
}
