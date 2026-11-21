'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import {
  CalendarPlus, LayoutDashboard, Users, Scissors, Settings, LogOut, Copy, Check, CreditCard, Lightbulb,
} from 'lucide-react'
import FeedbackModal from './FeedbackModal'

// ─────────────────────────────────────────────────────────────────────────────
// Barra lateral do Grafite: painel escuro flutuante (nos dois temas), com um
// brilho do verde da marca no topo. Por dentro é sempre "modo escuro", por isso
// as cores aqui são fixas e não saem das variáveis do tema.
// ─────────────────────────────────────────────────────────────────────────────

function getIniciais(nome: string | null, email: string): string {
  if (nome) {
    const partes = nome.trim().split(/\s+/).filter(Boolean)
    if (partes.length >= 2) return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
    return partes[0][0].toUpperCase()
  }
  return email[0].toUpperCase()
}

const NAV = [
  { href: '/dashboard',       label: 'Agenda',         icon: LayoutDashboard },
  { href: '/servicos',        label: 'Serviços',       icon: Scissors },
  { href: '/profissionais',   label: 'Profissionais',  icon: Users },
]

const CONTA = [
  { href: '/configuracoes',   label: 'Configurações',  icon: Settings },
  { href: '/plano',           label: 'Plano',          icon: CreditCard },
]

const item =
  'flex items-center gap-2.5 min-h-[38px] px-2.5 rounded-[10px] text-[14px] text-white/80 transition-colors duration-150 hover:bg-white/[.07] hover:text-white'
const itemAtivo =
  'bg-white/[.16] text-white font-semibold shadow-[inset_0_0_0_1px_rgba(255,255,255,.12)] hover:bg-white/[.16]'
const caps = 'px-2.5 pt-4 pb-1 text-[10.5px] font-semibold tracking-[.06em] uppercase text-white/55'

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const [nomeNegocio, setNomeNegocio] = useState<string | null>(null)
  const [slug,        setSlug]        = useState<string | null>(null)
  const [email,       setEmail]       = useState<string | null>(null)
  const [plano,       setPlano]       = useState<string | null>(null)
  const [copied,      setCopied]      = useState(false)
  const [feedback,    setFeedback]    = useState(false)

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

  const ativo = (href: string) => pathname === href || pathname.startsWith(href + '/')

  function itens(lista: typeof NAV) {
    return lista.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={ativo(href) ? 'page' : undefined}
            className={`${item} ${ativo(href) ? itemAtivo : ''}`}
          >
            <Icon size={16} strokeWidth={1.8} className="shrink-0" />
            <span className="flex-1">{label}</span>
            {href === '/plano' && plano && (
              <span className={`text-[11px] font-semibold px-1.5 h-[18px] inline-flex items-center rounded-[6px] ${
                plano === 'gratuito' ? 'bg-white/10 text-white/70' : 'bg-[#25D366]/20 text-[#5BE495]'
              }`}>
                {plano === 'gratuito' ? 'Grátis' : plano.charAt(0).toUpperCase() + plano.slice(1)}
              </span>
            )}
          </Link>
        ))
  }

  return (
    <aside
      className="flex flex-col h-[calc(100dvh-24px)] m-3 rounded-[20px] text-[#F5F5F7] overflow-y-auto"
      style={{
        width: 'var(--side-w)',
        padding: '18px 12px 12px',
        background:
          'radial-gradient(320px 300px at 10% -8%, color-mix(in srgb, var(--accent) 40%, transparent), transparent 70%), linear-gradient(180deg, rgba(255,255,255,.08), transparent 50%), linear-gradient(180deg, var(--side-top), var(--side-bottom))',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.28), inset 0 0 0 1px rgba(255,255,255,.06), var(--shadow-float)',
      }}
    >
      {/* Marca */}
      <Link href="/dashboard" onClick={onNavigate} className="px-2.5 pt-1 pb-4 block" aria-label="Marcaí, ir para a agenda">
        <img src="/logo.png" alt="Marcaí" style={{ height: 24 }} />
      </Link>

      {/* Ação principal: pílula clara no topo */}
      <Link
        href="/agendar-interno"
        onClick={onNavigate}
        aria-current={ativo('/agendar-interno') ? 'page' : undefined}
        className="flex items-center justify-center gap-2 h-[42px] mb-3 rounded-full bg-[#F5F5F7] text-[#1D1D1F] text-[14px] font-semibold transition-transform duration-100 active:scale-[.97] hover:bg-white"
      >
        <CalendarPlus size={16} strokeWidth={2} />
        Novo agendamento
      </Link>

      <nav className="flex flex-col gap-1">
        {itens(NAV)}
        <p className={caps}>Conta</p>
        {itens(CONTA)}
      </nav>

      <div className="flex-1" />

      {/* Link público */}
      {slug && (
        <div className="mb-3">
          <p className={caps}>Seu link</p>
          <button
            onClick={handleCopy}
            className="mt-1 w-full flex items-center gap-2 rounded-[10px] px-2.5 py-2 bg-white/[.06] hover:bg-white/10 transition-colors text-left"
            title="Copiar link"
          >
            <span className="flex-1 min-w-0 text-[12px] text-white/60 truncate">
              marcai.net.br/agendar/<span className="text-white">{slug}</span>
            </span>
            {copied
              ? <Check size={14} className="shrink-0 text-[#5BE495]" aria-label="Copiado" />
              : <Copy size={14} className="shrink-0 text-white/60" aria-label="Copiar" />}
          </button>
        </div>
      )}

      {/* Quem está logado */}
      <div className="pt-3 border-t border-white/10 flex flex-col gap-1">
        <Link
          href="/perfil"
          onClick={onNavigate}
          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] hover:bg-white/[.07] transition-colors ${ativo('/perfil') ? itemAtivo : ''}`}
        >
          <span className="w-8 h-8 rounded-full bg-white/[.12] grid place-items-center text-[13px] font-semibold shrink-0">
            {email ? getIniciais(nomeNegocio, email) : '…'}
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold truncate leading-tight">{nomeNegocio ?? '…'}</span>
            <span className="block text-[12px] text-white/55 truncate">{email ?? ''}</span>
          </span>
        </Link>

        <button onClick={() => setFeedback(true)} className={item}>
          <Lightbulb size={16} strokeWidth={1.8} />
          Enviar sugestão
        </button>
        <button onClick={handleLogout} className={item}>
          <LogOut size={16} strokeWidth={1.8} />
          Sair
        </button>
      </div>

      {feedback && <FeedbackModal onClose={() => setFeedback(false)} />}
    </aside>
  )
}
