import Link from 'next/link'
import LogoLink from './LogoLink'

export default function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <LogoLink />

          <nav className="hidden md:flex items-center gap-7">
            <a href="/#como-funciona" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Como funciona
            </a>
            <a href="/#recursos" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Recursos
            </a>
            <a href="/#faq" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              FAQ
            </a>
            <a href="/#precos" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Preços
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-4 py-2"
          >
            Entrar
          </Link>
          <Link
            href="/login?modo=cadastro"
            className="text-sm font-semibold px-5 py-2.5 rounded-xl text-white bg-[#25D366] transition-all duration-200 hover:bg-[#128C7E] hover:scale-[1.02]"
          >
            Começar grátis
          </Link>
        </div>
      </div>
    </header>
  )
}
