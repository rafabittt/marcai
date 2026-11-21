'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { maskName, maskPhone } from '@/lib/masks'
import { destinoSeguro } from '@/lib/destino'
import { emailJaCadastrado } from '@/lib/cadastro'

// Grafite: campo e rótulo vêm das peças prontas do globals.css.
const inputClass = 'field'
const labelClass = 'field-label'

function CadastroForm() {
  const [nome,     setNome]     = useState('')
  const [telefone, setTelefone] = useState('')
  const [email,    setEmail]    = useState('')
  const [senha,    setSenha]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [erro,     setErro]     = useState('')

  const router       = useRouter()
  const searchParams = useSearchParams()
  const redirect     = destinoSeguro(searchParams.get('redirect'), '/cliente/minha-conta')
  const supabase     = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (senha.length < 6) { setErro('A senha deve ter pelo menos 6 caracteres.'); return }
    setLoading(true)
    setErro('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome } },
    })

    let userId = data.user?.id
    if (error) {
      if (!emailJaCadastrado(error)) {
        setErro('Erro ao criar conta. Tente novamente.')
        setLoading(false)
        return
      }
      // E-mail já existe. Pode ser uma tentativa anterior que criou a conta mas
      // não gravou os dados do cliente. Com a senha certa, retomamos de onde parou.
      const login = await supabase.auth.signInWithPassword({ email, password: senha })
      if (login.error || !login.data.user) {
        setErro('Este e-mail já está cadastrado. Faça login.')
        setLoading(false)
        return
      }
      userId = login.data.user.id
    }

    if (!userId) {
      setErro('Erro ao criar conta. Tente novamente.')
      setLoading(false)
      return
    }

    // Grava os dados do cliente só se ainda não existem (retomada não duplica).
    const { data: existente } = await supabase
      .from('clientes')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (!existente) {
      const { error: erroInsert } = await supabase.from('clientes').insert({
        user_id:  userId,
        nome:     nome.trim(),
        telefone,
      })
      if (erroInsert) {
        // Antes o erro era ignorado e a pessoa seguia sem cadastro de cliente.
        setErro('Sua conta foi criada, mas não conseguimos salvar seus dados. Toque em "Criar conta" de novo.')
        setLoading(false)
        return
      }
    }

    router.push(redirect)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="card w-full max-w-[400px] !p-6 sm:!p-8">

        <div className="mb-6 text-center">
          <img src="/logo.png" alt="Marcaí" className="h-7 object-contain mx-auto mb-6" />
          <h1 className="t-title">Criar sua conta</h1>
          <p className="t-sub">Rápido e gratuito</p>
        </div>

        {erro && (
          <div className="note note-bad mb-5" role="alert">{erro}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="cad-1" className={labelClass}>Nome completo</label>
            <input id="cad-1"
              type="text"
              value={nome}
              onChange={e => setNome(maskName(e.target.value))}
              required
              placeholder="Maria Silva"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="cad-2" className={labelClass}>Telefone / WhatsApp</label>
            <input id="cad-2"
              type="tel"
              value={telefone}
              onChange={e => setTelefone(maskPhone(e.target.value))}
              required
              placeholder="(11) 99999-9999"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="cad-3" className={labelClass}>E-mail</label>
            <input id="cad-3"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="cad-4" className={labelClass}>Senha</label>
            <input id="cad-4"
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
              placeholder="Mínimo 6 caracteres"
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg btn-block"
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="t-cap !text-sm text-center mt-5">
          Já tem conta?{' '}
          <Link
            href={`/cliente/login?redirect=${encodeURIComponent(redirect)}`}
            className="link"
          >
            Entrar
          </Link>
        </p>

      </div>
    </div>
  )
}

export default function ClienteCadastroPage() {
  return (
    <Suspense>
      <CadastroForm />
    </Suspense>
  )
}
