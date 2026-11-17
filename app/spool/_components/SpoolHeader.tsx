import Link from 'next/link'

export default function SpoolHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#EBDAC6]/80 bg-[#FFF4E8]/85 backdrop-blur">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <Link href="/spool" className="flex items-center gap-2.5" aria-label="Spool, página inicial">
          <img src="/spool/simbolo.svg" alt="" width={30} height={30} />
          <img src="/spool/nome.svg" alt="Spool" style={{ height: 20, width: 'auto' }} />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2 text-sm">
          <Link href="/spool/privacidade" className="hidden sm:inline px-3 py-2 rounded-lg text-[#5F5850] hover:text-[#141414] hover:bg-white/60 transition-colors">
            Privacidade
          </Link>
          <Link href="/spool/termos" className="hidden sm:inline px-3 py-2 rounded-lg text-[#5F5850] hover:text-[#141414] hover:bg-white/60 transition-colors">
            Termos
          </Link>
          <Link
            href="/"
            className="px-3 py-2 rounded-lg text-[#5F5850] hover:text-[#141414] hover:bg-white/60 transition-colors"
          >
            um produto <span className="font-semibold text-[#141414]">Marcaí</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}
