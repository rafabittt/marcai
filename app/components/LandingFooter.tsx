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
      { label: 'Falar no WhatsApp', href: 'https://wa.me/5511999999999', external: true },
      { label: 'Instagram', href: 'https://instagram.com/usemarcai', external: true },
    ],
  },
]

export default function LandingFooter() {
  return (
    <footer className="border-t border-gray-100" style={{ backgroundColor: '#f9f9f9' }}>

      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col md:flex-row md:justify-between gap-10">
        {/* Logo + tagline */}
        <div className="flex flex-col gap-3 max-w-xs">
          <img src="/logo.png" alt="Marcaí" style={{ height: '22px', width: 'auto', objectFit: 'contain', objectPosition: 'left' }} />
          <p className="text-sm text-gray-500 leading-relaxed">
            Agendamento simples pelo WhatsApp para pequenos negócios brasileiros.
          </p>
        </div>

        {/* Colunas de links agrupadas */}
        <div className="flex gap-16">
          {columns.map(col => (
            <div key={col.heading}>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
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
                        className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
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
      <div className="border-t border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span>© 2026 Marcaí</span>
            <Link href="/termos" className="hover:text-gray-600 transition-colors">Termos</Link>
            <Link href="/privacidade" className="hover:text-gray-600 transition-colors">Privacidade</Link>
          </div>
          <span>Feito para pequenos negócios brasileiros 🇧🇷</span>
        </div>
      </div>

    </footer>
  )
}
