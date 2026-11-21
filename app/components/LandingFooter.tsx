import Link from 'next/link'

const columns = [
  {
    heading: 'Produto',
    links: [
      { label: 'Como funciona', href: '/#como-funciona' },
      { label: 'Recursos', href: '/#recursos' },
      { label: 'FAQ', href: '/#faq' },
      { label: 'Preços', href: '/#precos' },
    ],
  },
  {
    heading: 'Suporte',
    links: [
      { label: 'Falar no WhatsApp', href: 'https://wa.me/5511924905512', external: true },
      { label: 'Instagram', href: 'https://instagram.com/usemarcai', external: true },
    ],
  },
]

// Rodapé no Grafite: em cima do fundo da página, separado por uma borda fina.
const linkClass = 'text-sm text-muted hover:text-fg transition-colors duration-150'

export default function LandingFooter() {
  return (
    <footer className="border-t border-hairline">

      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col md:flex-row md:justify-between gap-10">
        {/* Logo + tagline */}
        <div className="flex flex-col gap-3 max-w-xs">
          <img src="/logo.png" alt="Marcaí" style={{ height: '22px', width: 'auto', objectFit: 'contain', objectPosition: 'left' }} />
          <p className="text-sm text-muted leading-relaxed">
            Agendamento simples pelo WhatsApp para pequenos negócios brasileiros.
          </p>
        </div>

        {/* Colunas de links agrupadas */}
        <div className="flex gap-16">
          {columns.map(col => (
            <div key={col.heading}>
              <p className="t-caps mb-3">
                {col.heading}
              </p>
              <ul className="space-y-2">
                {col.links.map(link => (
                  <li key={link.label}>
                    {'external' in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkClass}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className={linkClass}>
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Rodapé */}
      <div className="border-t border-hairline px-6 py-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 t-cap">
          <div className="flex items-center gap-4">
            <span>© 2026 Marcaí</span>
            <Link href="/termos" className="hover:text-fg transition-colors duration-150">Termos</Link>
            <Link href="/privacidade" className="hover:text-fg transition-colors duration-150">Privacidade</Link>
            <Link href="/spool" className="hover:text-fg transition-colors duration-150">Spool</Link>
          </div>
          <span className="text-center sm:text-right">MARCAI TECNOLOGIA LTDA · CNPJ 66.469.940/0001-32 · Barueri/SP</span>
        </div>
      </div>

    </footer>
  )
}
