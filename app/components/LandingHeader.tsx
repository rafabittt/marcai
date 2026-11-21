import Link from 'next/link'
import LogoLink from './LogoLink'

// Cabeçalho do site: flutua por cima do conteúdo, então leva vidro (.glass).
// O botão preto principal fica no conteúdo de cada bloco; aqui os dois são
// secundários para não disputar com ele.

export default function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 glass border-b border-hairline">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-10">
          <LogoLink />

          <nav className="hidden md:flex items-center gap-7">
            <Link href="/#como-funciona" className="text-sm text-muted hover:text-fg transition-colors duration-150">
              Como funciona
            </Link>
            <Link href="/#recursos" className="text-sm text-muted hover:text-fg transition-colors duration-150">
              Recursos
            </Link>
            <Link href="/#faq" className="text-sm text-muted hover:text-fg transition-colors duration-150">
              FAQ
            </Link>
            <Link href="/#precos" className="text-sm text-muted hover:text-fg transition-colors duration-150">
              Preços
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link href="/login" className="btn btn-ghost max-sm:h-11">
            Entrar
          </Link>
          <Link href="/login?modo=cadastro" className="btn max-sm:h-11">
            Começar grátis
          </Link>
        </div>
      </div>
    </header>
  )
}
