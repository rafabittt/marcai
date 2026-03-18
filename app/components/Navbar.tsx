'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'

function getIniciaisNegocio(nomeNegocio: string | null, email: string): string {
  if (nomeNegocio) {
    const partes = nomeNegocio.trim().split(/\s+/).filter(Boolean)
    if (partes.length >= 2) {
      return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
    }
    return partes[0][0].toUpperCase()
  }
  return email[0].toUpperCase()
}

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [nomeNegocio, setNomeNegocio] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isLogin = pathname.startsWith('/login')
  const isHome = pathname === '/'
  const isAgendar = pathname.startsWith('/agendar')
  const isPublicPage = pathname === '/termos' || pathname === '/privacidade'

  useEffect(() => {
    if (isLogin) {
      setLoaded(true)
      return
    }
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoaded(true); return }
      setEmail(user.email ?? null)
      const { data: negocio } = await supabase
        .from('negocios')
        .select('nome')
        .eq('user_id', user.id)
        .maybeSingle()
      setNomeNegocio(negocio?.nome ?? null)
      setLoaded(true)
    })
  }, [isLogin])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Nunca mostra na home, login ou páginas de agendamento público
  if (isHome || isLogin || isAgendar || isPublicPage) return null

  // Enquanto carrega (evita flash)
  if (!loaded) return null

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link href="/agenda">
          <img src="/logo.png" alt="Marcaí" style={{ height: '28px' }} />
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/agenda"
            className={`text-sm font-medium transition-colors ${
              pathname === '/agenda'
                ? 'text-[#25D366]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Agenda
          </Link>
          <Link
            href="/configuracoes"
            className={`text-sm font-medium transition-colors ${
              pathname === '/configuracoes'
                ? 'text-[#25D366]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Configurações
          </Link>
        </div>
      </div>

      {/* Lado direito: avatar (logado) ou botão Entrar (não logado) */}
      {!email ? (
        <Link
          href="/login"
          className="text-sm font-semibold border-2 border-[#25D366] text-[#25D366] px-4 py-1.5 rounded-xl transition-all duration-200 hover:bg-[#dcfce7] hover:scale-[1.02]"
        >
          Entrar
        </Link>
      ) : (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(prev => !prev)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold bg-[#25D366] focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 transition-all duration-200 hover:bg-[#128C7E] hover:scale-[1.02]"
            aria-label="Menu do usuário"
          >
            {getIniciaisNegocio(nomeNegocio, email!)}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
              <div className="px-4 py-2.5 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-700 truncate">{nomeNegocio ?? email}</p>
              </div>

              <Link
                href="/perfil"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Meu perfil
              </Link>

              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
