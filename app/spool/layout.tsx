import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import SpoolHeader from './_components/SpoolHeader'
import SpoolFooter from './_components/SpoolFooter'

// Spool é um produto da Marcai com marca própria (tangerina + tinta + creme, Poppins nos títulos e Inter no
// texto). Estas páginas existem para as revisões do Google, Meta, TikTok e LinkedIn: dizem o que o app faz,
// quem é a empresa responsável e onde estão a privacidade e os termos.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'Spool · agendador de posts da Marcai', template: '%s · Spool' },
  description:
    'Spool agenda publicações no YouTube, no Instagram, em páginas do LinkedIn e no TikTok pelas APIs oficiais. Um produto da MARCAI TECNOLOGIA LTDA.',
  icons: { icon: '/spool/favicon.svg', apple: '/spool/apple-touch-icon.png' },
}

export default function SpoolLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${inter.variable} min-h-screen flex flex-col text-[#141414]`}
      style={{
        fontFamily: 'var(--font-inter), system-ui, sans-serif',
        background:
          'radial-gradient(1000px 460px at 78% -160px, rgba(255,122,0,.15), transparent 70%), radial-gradient(760px 420px at -8% -60px, rgba(255,122,0,.07), transparent 70%), #FFF4E8',
      }}
    >
      <SpoolHeader />
      <main className="flex-1">{children}</main>
      <SpoolFooter />
    </div>
  )
}
