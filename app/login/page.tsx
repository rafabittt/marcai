'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { maskName, maskPhone } from '@/lib/masks'
import LandingHeader from '../components/LandingHeader'

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

const inputClass = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#25D366] placeholder-gray-300'
const labelClass = 'text-xs uppercase tracking-widest text-gray-500 font-medium mb-1.5 block'

function LoginContent() {
  const searchParams = useSearchParams()
  const [modo, setModo] = useState<'login' | 'cadastro'>(
    searchParams.get('modo') === 'cadastro' ? 'cadastro' : 'login'
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Auth
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Negócio (só usado no cadastro)
  const [negNome, setNegNome] = useState('')
  const [negTipo, setNegTipo] = useState(TIPOS[0])
  const [negTelefone, setNegTelefone] = useState('')
  const [negSlug, setNegSlug] = useState('')
  const [slugEditado, setSlugEditado] = useState(false)

  const supabase = createClient()

  function handleNegNomeChange(value: string) {
    setNegNome(value)
    if (!slugEditado) setNegSlug(toSlug(value))
  }

  function handleNegSlugChange(value: string) {
    setSlugEditado(true)
    setNegSlug(toSlug(value))
  }

  async function handleLogin(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email ou senha incorretos')
      setLoading(false)
    } else {
      window.location.href = '/agenda'
    }
  }

  async function handleCadastro(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!negSlug) { setError('O link público não pode ficar vazio.'); return }

    setLoading(true)
    setError('')

    // 1. Criar conta no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password, options: { data: { full_name: nomeCompleto } } })
    if (authError) {
      setError('Erro ao criar conta: ' + authError.message)
      setLoading(false)
      return
    }

    const user = authData.user
    if (!user) {
      setError('Erro inesperado. Tente novamente.')
      setLoading(false)
      return
    }

    // 2. Verificar unicidade do slug
    const { data: existing } = await supabase
      .from('negocios')
      .select('id')
      .eq('slug', negSlug)
      .maybeSingle()

    if (existing) {
      setError('Esse link já está em uso. Escolha outro.')
      setLoading(false)
      return
    }

    // 3. Inserir negócio
    const { error: negError } = await supabase.from('negocios').insert({
      user_id: user.id,
      nome: negNome,
      tipo: negTipo,
      telefone: negTelefone,
      slug: negSlug,
    })

    if (negError) {
      setError('Conta criada, mas erro ao salvar negócio. Tente novamente.')
      setLoading(false)
      return
    }

    window.location.href = '/agenda'
  }

  function trocarModo(novoModo: 'login' | 'cadastro') {
    setModo(novoModo)
    setError('')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LandingHeader />
      <div className="flex items-center justify-center px-4 py-12">
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">

        <div className="mb-8">
          <p className="text-sm text-gray-500">
            {modo === 'login' ? 'Gerencie seus agendamentos com facilidade' : 'Crie sua conta e configure seu negócio'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl mb-5">
            {error}
          </div>
        )}

        {/* ── LOGIN ── */}
        {modo === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
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
            <div>
              <label className={labelClass}>Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
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
            <div className="flex justify-end">
              <a
                href="/forgot-password"
                className="text-xs text-[#25D366] hover:underline"
              >
                Esqueci minha senha
              </a>
            </div>
            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-[#25D366] transition-all duration-200 hover:bg-[#128C7E] hover:scale-[1.02] disabled:opacity-50"
              >
                {loading ? 'Aguarde...' : 'Entrar'}
              </button>
            </div>
          </form>
        )}

        {/* ── CADASTRO ── */}
        {modo === 'cadastro' && (
          <form onSubmit={handleCadastro} className="space-y-4">
            <div>
              <label className={labelClass}>Seu nome completo</label>
              <input
                type="text"
                value={nomeCompleto}
                onChange={e => setNomeCompleto(maskName(e.target.value))}
                className={inputClass}
                placeholder="João Silva"
                required
              />
            </div>
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
            <div>
              <label className={labelClass}>Senha</label>
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

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-4">Seu negócio</p>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Nome do negócio</label>
                  <input
                    type="text"
                    value={negNome}
                    onChange={e => handleNegNomeChange(e.target.value)}
                    required
                    placeholder="Barbearia do João"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Tipo do negócio</label>
                  <select
                    value={negTipo}
                    onChange={e => setNegTipo(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#25D366] bg-white"
                  >
                    {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Telefone / WhatsApp</label>
                  <input
                    type="tel"
                    value={negTelefone}
                    onChange={e => setNegTelefone(maskPhone(e.target.value))}
                    required
                    placeholder="(11) 99999-9999"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Seu link público</label>
                  <input
                    type="text"
                    value={negSlug}
                    onChange={e => handleNegSlugChange(e.target.value)}
                    required
                    placeholder="barbearia-do-joao"
                    className={inputClass}
                  />
                  {negSlug && (
                    <p className="mt-2 text-xs text-gray-500">
                      Seu link:{' '}
                      <span className="font-medium text-[#25D366]">
                        marcai.net.br/agendar/{negSlug}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-[#25D366] transition-all duration-200 hover:bg-[#128C7E] hover:scale-[1.02] disabled:opacity-50"
              >
                {loading ? 'Criando conta...' : 'Criar minha conta'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => trocarModo(modo === 'login' ? 'cadastro' : 'login')}
            className="text-sm font-medium text-[#25D366] hover:underline transition-all duration-200"
          >
            {modo === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
          </button>
        </div>

      </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
