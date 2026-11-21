'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { maskName, maskPhone } from '@/lib/masks'
import { decidirCadastro, emailJaCadastrado, ehLinkDuplicado } from '@/lib/cadastro'
import LandingHeader from '../components/LandingHeader'
import MetaPixel from '../components/MetaPixel'
import Abas from '../components/Abas'
import { rastrearCadastroConcluido } from '@/lib/pixel'

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

// Grafite: campo e rótulo vêm das peças prontas do globals.css.
const inputClass = 'field'
const labelClass = 'field-label'
// Campo de senha: espaço à direita para o botão de mostrar/esconder.
const senhaClass = 'field pr-11'
const olhoClass = 'btn btn-ghost btn-icon btn-sm absolute right-1.5 top-1/2 -translate-y-1/2'

function LoginContent() {
  const searchParams = useSearchParams()
  const [tipo, setTipo] = useState<'negocio' | 'cliente'>('negocio')
  const [modo, setModo] = useState<'login' | 'cadastro'>(
    searchParams.get('modo') === 'cadastro' ? 'cadastro' : 'login'
  )

  useEffect(() => {
    setModo(searchParams.get('modo') === 'cadastro' ? 'cadastro' : 'login')
  }, [searchParams])

  // Estado separado para login de cliente
  const [clienteEmail,   setClienteEmail]   = useState('')
  const [clienteSenha,   setClienteSenha]   = useState('')
  const [clienteLoading, setClienteLoading] = useState(false)
  const [clienteErro,    setClienteErro]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Auth
  const [email, setEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [confirmEmailError, setConfirmEmailError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')

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
      const redirect = searchParams.get('redirect')
      window.location.href = redirect ?? '/dashboard'
    }
  }

  async function handleCadastro(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()

    let valid = true
    setConfirmEmailError('')
    setConfirmPasswordError('')

    if (email !== confirmEmail) {
      setConfirmEmailError('Os emails não coincidem.')
      valid = false
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('As senhas não coincidem.')
      valid = false
    }
    if (!valid) return

    if (!negSlug) { setError('O link público não pode ficar vazio.'); return }

    setLoading(true)
    setError('')

    try {
      // 1. O link está livre? Checado ANTES de criar a conta, para nunca sobrar
      //    conta sem negócio por causa de link repetido. Pela VIEW pública: a
      //    tabela negocios não é legível sem login, e consultá-la aqui daria
      //    "permissão negada" — o código leria isso como "link livre".
      const { data: ocupado, error: erroLink } = await supabase
        .from('negocios_publico')
        .select('id')
        .eq('slug', negSlug)
        .maybeSingle()

      if (erroLink) {
        setError('Não foi possível verificar o link agora. Tente novamente.')
        setLoading(false)
        return
      }
      if (ocupado) {
        setError('Esse link já está em uso. Escolha outro.')
        setLoading(false)
        return
      }

      // 2. Criar a conta — ou, se o e-mail já existe, decidir o que fazer.
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password, options: { data: { full_name: nomeCompleto } } })

      let userId = authData?.user?.id ?? null
      const conta = authError
        ? (emailJaCadastrado(authError) ? 'email_existe' : 'erro')
        : (userId ? 'criada' : 'erro')

      let loginOk: boolean | undefined
      let temNegocio: boolean | undefined
      if (conta === 'email_existe') {
        // Pode ser uma tentativa anterior que criou a conta e falhou no
        // negócio. Só seguimos se a senha conferir.
        const { data: login, error: loginError } = await supabase.auth.signInWithPassword({ email, password })
        loginOk = !loginError && !!login.user
        if (loginOk && login.user) {
          userId = login.user.id
          const { data: neg } = await supabase
            .from('negocios').select('id').eq('user_id', userId).maybeSingle()
          temNegocio = !!neg
        }
      }

      const proximo = decidirCadastro({ conta, mensagemErro: authError?.message, loginOk, temNegocio })

      if (proximo.acao === 'erro') {
        setError(proximo.mensagem)
        setLoading(false)
        return
      }
      if (proximo.acao === 'ir_painel') {
        // Já é cliente e a senha conferiu: só leva para o painel.
        window.location.href = '/dashboard'
        return
      }
      if (!userId) {
        setError('Erro inesperado ao criar conta. Tente novamente.')
        setLoading(false)
        return
      }

      // 3. Gravar o negócio.
      const { error: negError } = await supabase.from('negocios').insert({
        user_id: userId,
        nome: negNome,
        tipo: negTipo,
        telefone: negTelefone,
        slug: negSlug,
      })

      if (negError) {
        // A conta fica criada, mas não trava mais: enviar de novo com o mesmo
        // e-mail e senha cai no passo 2 e retoma daqui.
        setError(ehLinkDuplicado(negError)
          ? 'Esse link acabou de ser usado por outra pessoa. Escolha outro e envie de novo — sua conta já está criada e será aproveitada.'
          : 'Não foi possível salvar o negócio. Envie de novo com o mesmo e-mail e senha para concluir.')
        setLoading(false)
        return
      }

      // Notifica o dono do Marcaí sobre novo cadastro (fire-and-forget)
      fetch('/api/notify-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: negNome, tipo: negTipo, email }),
      }).catch(() => {})

      // Cadastro concluído de verdade: conta pronta E negócio gravado (inclui a
      // retomada). Nenhum erro acima chega aqui. O evento não leva nenhum dado
      // pessoal, e só dispara se o Pixel foi carregado (produção + consentimento).
      await rastrearCadastroConcluido()

      const redirect = searchParams.get('redirect')
      window.location.href = redirect ?? '/configuracoes'
    } catch {
      setError('Ocorreu um erro inesperado. Tente novamente.')
      setLoading(false)
    }
  }

  function trocarModo(novoModo: 'login' | 'cadastro') {
    setModo(novoModo)
    setError('')
  }

  async function handleClienteLogin(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setClienteLoading(true)
    setClienteErro('')
    const { error } = await supabase.auth.signInWithPassword({ email: clienteEmail, password: clienteSenha })
    if (error) {
      setClienteErro('E-mail ou senha incorretos.')
      setClienteLoading(false)
    } else {
      const redirect = searchParams.get('redirect')
      window.location.href = redirect ?? '/cliente/minha-conta'
    }
  }

  return (
    <div className="min-h-screen">
      <LandingHeader />
      {/* Pixel só no cadastro de NEGÓCIO. Esta página também tem a aba de login
          do cliente final, que não pode ser rastreado. */}
      {tipo === 'negocio' && modo === 'cadastro' && <MetaPixel />}
      <div className="flex justify-center px-4 py-10 sm:py-14">
      <div className="card w-full max-w-[440px] !p-6 sm:!p-8">

        {/* Toggle Negócio / Cliente */}
        <div className="flex justify-center mb-6">
          <Abas
            rotulo="Tipo de conta"
            valor={tipo}
            onChange={setTipo}
            opcoes={[['negocio', 'Negócio'], ['cliente', 'Cliente']] as const}
          />
        </div>

        <div className="mb-6">
          <h1 className="t-title">
            {tipo === 'cliente' ? 'Entrar' : modo === 'login' ? 'Entrar' : 'Criar conta'}
          </h1>
          {tipo === 'negocio' && (
            <p className="t-sub">
              {modo === 'login' ? 'Gerencie seus agendamentos com facilidade' : 'Crie sua conta e configure seu negócio'}
            </p>
          )}
        </div>

        {/* ── CLIENTE ── */}
        {tipo === 'cliente' && (
          <>
            {clienteErro && (
              <div className="note note-bad mb-5" role="alert">{clienteErro}</div>
            )}
            <form onSubmit={handleClienteLogin} className="space-y-4">
              <div>
                <label className={labelClass}>E-mail</label>
                <input type="email" value={clienteEmail} onChange={e => setClienteEmail(e.target.value)} required placeholder="seu@email.com" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Senha</label>
                <input type="password" value={clienteSenha} onChange={e => setClienteSenha(e.target.value)} required placeholder="••••••••" className={inputClass} />
              </div>
              <div className="pt-1">
                <button type="submit" disabled={clienteLoading} className="btn btn-primary btn-lg btn-block">
                  {clienteLoading ? 'Entrando...' : 'Entrar'}
                </button>
              </div>
            </form>
            <p className="t-cap !text-sm text-center mt-5">
              Não tem conta?{' '}
              <a href="/cliente/cadastro" className="link">Criar conta</a>
            </p>
          </>
        )}

        {/* ── NEGÓCIO ── */}
        {tipo === 'negocio' && <>

        {error && (
          <div className="note note-bad mb-5" role="alert">
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
                  className={senhaClass}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className={olhoClass}
                  aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <a
                href="/forgot-password"
                className="link text-[13px]"
              >
                Esqueci minha senha
              </a>
            </div>
            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg btn-block"
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
                onChange={e => { setEmail(e.target.value); setConfirmEmailError('') }}
                className={inputClass}
                placeholder="seu@email.com"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Confirme seu email</label>
              <input
                type="email"
                value={confirmEmail}
                onChange={e => { setConfirmEmail(e.target.value); setConfirmEmailError('') }}
                className={inputClass}
                aria-invalid={confirmEmailError ? true : undefined}
                placeholder="seu@email.com"
                required
              />
              {confirmEmailError && (
                <p className="field-hint text-bad-ink">{confirmEmailError}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setConfirmPasswordError('') }}
                  className={senhaClass}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className={olhoClass}
                  aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
                </button>
              </div>
            </div>
            <div>
              <label className={labelClass}>Confirme sua senha</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setConfirmPasswordError('') }}
                  className={senhaClass}
                  aria-invalid={confirmPasswordError ? true : undefined}
                  placeholder="Repita a senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(p => !p)}
                  className={olhoClass}
                  aria-label={showConfirmPassword ? 'Esconder senha' : 'Mostrar senha'}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
                </button>
              </div>
              {confirmPasswordError && (
                <p className="field-hint text-bad-ink">{confirmPasswordError}</p>
              )}
            </div>

            <div className="border-t border-hairline pt-5 mt-2">
              <h2 className="t-section mb-4">Seu negócio</h2>
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
                    className="field"
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
                    <p className="field-hint break-all">
                      Seu link:{' '}
                      <span className="font-medium text-accent-ink">
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
                className="btn btn-primary btn-lg btn-block"
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
            className="link text-sm"
          >
            {modo === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
          </button>
        </div>

        </> /* fim bloco negócio */}

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
