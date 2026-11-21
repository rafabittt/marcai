'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

// Grafite: campo e rótulo vêm das peças prontas do globals.css.
const inputClass = 'field'
const labelClass = 'field-label'

function LoginForm() {
  const [email,  setEmail]  = useState('')
  const [senha,  setSenha]  = useState('')
  const [loading, setLoading] = useState(false)
  const [erro,   setErro]   = useState('')

  const router       = useRouter()
  const searchParams = useSearchParams()
  const redirect     = searchParams.get('redirect') ?? '/cliente/minha-conta'
  const supabase     = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })

    if (error) {
      setErro('E-mail ou senha incorretos.')
      setLoading(false)
      return
    }

    router.push(redirect)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="card w-full max-w-[400px] !p-6 sm:!p-8">

        <div className="mb-6 text-center">
          <img src="/logo.png" alt="Marcaí" className="h-7 object-contain mx-auto mb-6" />
          <h1 className="t-title">Entrar na sua conta</h1>
          <p className="t-sub">Acesse seus agendamentos</p>
        </div>

        {erro && (
          <div className="note note-bad mb-5" role="alert">{erro}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Senha</label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
              placeholder="••••••••"
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg btn-block"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="t-cap !text-sm text-center mt-5">
          Não tem conta?{' '}
          <Link
            href={`/cliente/cadastro?redirect=${encodeURIComponent(redirect)}`}
            className="link"
          >
            Criar conta
          </Link>
        </p>

        <div className="mt-6 pt-5 border-t border-hairline text-center">
          <p className="t-cap">
            É dono de negócio?{' '}
            <Link href="/login" className="link">
              Acesse o painel
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}

export default function ClienteLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
