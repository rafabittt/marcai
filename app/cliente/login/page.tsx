'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const inputClass = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#25D366] placeholder-gray-300'
const labelClass = 'text-xs uppercase tracking-widest text-gray-500 font-medium mb-1.5 block'

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm p-8">

        <div className="mb-8 text-center">
          <img src="/logo.png" alt="Marcaí" className="h-7 object-contain mx-auto mb-6" />
          <h1 className="text-xl font-bold text-gray-900">Entrar na sua conta</h1>
          <p className="text-sm text-gray-500 mt-1">Acesse seus agendamentos</p>
        </div>

        {erro && (
          <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl mb-5">{erro}</div>
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
            className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-[#25D366] transition-all duration-200 hover:bg-[#128C7E] disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-6">
          Não tem conta?{' '}
          <Link
            href={`/cliente/cadastro?redirect=${encodeURIComponent(redirect)}`}
            className="text-[#25D366] font-semibold hover:underline"
          >
            Criar conta
          </Link>
        </p>

        <div className="mt-6 pt-5 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            É dono de negócio?{' '}
            <Link href="/login" className="text-[#25D366] font-medium hover:underline">
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
