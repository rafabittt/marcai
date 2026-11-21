import Link from 'next/link'

// Barra de cima: flutua sobre a página, então leva vidro (regra do Grafite).
export default function SpoolHeader() {
  return (
    <header className="glass sticky top-0 z-50 border-b border-hairline">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <Link href="/spool" className="flex items-center gap-2.5 rounded-inner" aria-label="Spool, página inicial">
          <img src="/spool/simbolo.svg" alt="" width={30} height={30} />
          {/* o nome é desenhado em preto; no escuro invertemos para ficar claro */}
          <img src="/spool/nome.svg" alt="Spool" className="dark:invert" style={{ height: 20, width: 'auto' }} />
        </Link>
        <nav className="flex items-center gap-1">
          <Link href="/spool/privacidade" className="btn btn-ghost btn-sm hidden sm:inline-flex">
            Privacidade
          </Link>
          <Link href="/spool/termos" className="btn btn-ghost btn-sm hidden sm:inline-flex">
            Termos
          </Link>
          <Link href="/" className="btn btn-ghost btn-sm max-sm:h-11 font-normal">
            um produto <span className="font-semibold text-fg">Marcaí</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}
