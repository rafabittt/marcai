'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import {
  CalendarPlus, LayoutDashboard, Users, Settings, LogOut, Copy, Check, CreditCard,
} from 'lucide-react'

function getIniciais(nome: string | null, email: string): string {
  if (nome) {
    const partes = nome.trim().split(/\s+/).filter(Boolean)
    if (partes.length >= 2) return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
    return partes[0][0].toUpperCase()
  }
  return email[0].toUpperCase()
}

const NAV = [
  { href: '/agendar-interno', label: 'Agendar',        icon: CalendarPlus,     cta: true  },
  { href: '/dashboard',       label: 'Dashboard',      icon: LayoutDashboard,  cta: false },
  { href: '/profissionais',   label: 'Profissionais',  icon: Users,            cta: false },
  { href: '/configuracoes',   label: 'Configurações',  icon: Settings,         cta: false },
  { href: '/plano',           label: 'Plano',          icon: CreditCard,       cta: false },
]

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const [nomeNegocio, setNomeNegocio] = useState<string | null>(null)
  const [slug,        setSlug]        = useState<string | null>(null)
  const [email,       setEmail]       = useState<string | null>(null)
  const [plano,       setPlano]       = useState<string | null>(null)
  const [copied,      setCopied]      = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setEmail(user.email ?? null)
      const { data } = await supabase
        .from('negocios')
        .select('nome, slug, plano')
        .eq('user_id', user.id)
        .maybeSingle()
      setNomeNegocio(data?.nome ?? null)
      setSlug(data?.slug ?? null)
      setPlano(data?.plano ?? 'gratuito')
    })
  }, [])

  function handleCopy() {
    if (!slug) return
    navigator.clipboard.writeText(`https://marcai.net.br/agendar/${slug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      className="flex flex-col h-screen sticky top-0 shrink-0 bg-white border-r border-gray-100"
      style={{ width: 240 }}
    >
      {/* Logo */}
      <div className="px-6 pt-6 pb-5">
        <Link href="/">
          <img src="/logo.png" alt="Marcaí" style={{ height: 26 }} />
        </Link>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-1 space-y-1">
        {NAV.map(({ href, label, icon: Icon, cta }) => {
          const active = pathname === href || pathname.startsWith(href + '/')

          if (cta) {
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: '#25D366' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#128C7E')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#25D366')}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          }

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-[#dcfce7] text-[#128C7E]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={16} />
              <span className="flex-1">{label}</span>
              {href === '/plano' && plano && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                  plano === 'gratuito'
                    ? 'bg-gray-100 text-gray-500'
                    : 'bg-[#dcfce7] text-[#128C7E]'
                }`}>
                  {plano === 'gratuito' ? 'Grátis' : plano.charAt(0).toUpperCase() + plano.slice(1)}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Link público */}
      {slug && (
        <div className="px-4 pb-3">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1.5 px-1">
            Seu link
          </p>
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
            <span className="flex-1 text-xs text-gray-500 truncate">
              marcai.net.br/agendar/<span className="text-[#25D366] font-medium">{slug}</span>
            </span>
            <button
              onClick={handleCopy}
              title="Copiar link"
              className="shrink-0 text-gray-400 hover:text-[#25D366] transition-colors"
            >
              {copied ? <Check size={14} className="text-[#25D366]" /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      )}

      {/* Avatar + nome do negócio + Sair */}
      <div className="px-5 py-4 border-t border-gray-100">
        <Link href="/perfil" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center text-white text-sm font-semibold shrink-0 group-hover:bg-[#128C7E] transition-colors">
            {email ? getIniciais(nomeNegocio, email) : '…'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-gray-800 truncate leading-tight">
              {nomeNegocio ?? '…'}
            </p>
            <p className="text-xs text-gray-400 truncate">{email ?? ''}</p>
          </div>
        </Link>

        <button
          onClick={handleLogout}
          className="mt-3 w-full flex items-center gap-2 text-sm text-red-500 hover:text-red-600 px-1 transition-colors"
        >
          <LogOut size={14} />
          Sair
        </button>
      </div>
    </aside>
  )
}
