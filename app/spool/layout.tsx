import type { Metadata } from 'next'
import SpoolHeader from './_components/SpoolHeader'
import SpoolFooter from './_components/SpoolFooter'

// Spool é um produto da Marcai com marca própria. Estas páginas existem para as revisões do Google, Meta,
// TikTok e LinkedIn: dizem o que o app faz, quem é a empresa responsável e onde estão a privacidade e os termos.
//
// Visual: o Grafite, igual ao resto do site (fundo, cartões, botões e fonte vêm de app/globals.css).
// A única diferença é a cor de destaque: aqui dentro ela é a tangerina do Spool, não o verde do Marcaí.
// As variáveis que dependem do destaque (--accent-soft, --ring, --ok*) são refeitas aqui porque o :root
// já as calculou com o verde.
const CORES_DO_SPOOL = `
.spool-tema {
  --accent: #FF7A00; --accent-text: #141414; --accent-ink: #A34700;
  --accent-soft: color-mix(in srgb, var(--accent) 14%, var(--surface));
  --ok: var(--accent); --ok-ink: var(--accent-ink); --ok-bg: var(--accent-soft);
  --ring: 0 0 0 3px color-mix(in srgb, var(--accent) 45%, transparent);
}
@media (prefers-color-scheme: dark) {
  .spool-tema {
    --accent: #FF8A1F; --accent-ink: #FFA552;
    --accent-soft: color-mix(in srgb, var(--accent) 16%, var(--surface));
  }
}
`

export const metadata: Metadata = {
  title: { default: 'Spool · agendador de posts da Marcai', template: '%s · Spool' },
  description:
    'Spool agenda publicações no YouTube, no Instagram, em páginas do LinkedIn e no TikTok pelas APIs oficiais. Um produto da MARCAI TECNOLOGIA LTDA.',
  icons: { icon: '/spool/favicon.svg', apple: '/spool/apple-touch-icon.png' },
}

export default function SpoolLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="spool-tema min-h-screen flex flex-col text-fg">
      <style dangerouslySetInnerHTML={{ __html: CORES_DO_SPOOL }} />
      <SpoolHeader />
      <main className="flex-1">{children}</main>
      <SpoolFooter />
    </div>
  )
}
