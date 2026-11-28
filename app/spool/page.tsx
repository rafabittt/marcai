import Link from 'next/link'
import { Youtube, Instagram, Linkedin, Music2, PlugZap, CalendarClock, CheckCircle2, Lock, ArrowRight } from 'lucide-react'
import { EMPRESA } from './_components/empresa'

const REDES = [
  {
    nome: 'YouTube',
    icone: Youtube,
    texto: 'Envia o vídeo com título e descrição e deixa marcado para publicar no horário escolhido. Mostra os números do canal e dos vídeos.',
  },
  {
    nome: 'Instagram',
    icone: Instagram,
    texto: 'Publica Reels, fotos e carrosséis com legenda em contas profissionais. Mostra alcance, views e curtidas dos posts.',
  },
  {
    nome: 'LinkedIn',
    icone: Linkedin,
    texto: 'Publica textos, fotos, vídeos, documentos e enquetes nas páginas de empresa que a pessoa administra.',
  },
  {
    nome: 'TikTok',
    icone: Music2,
    texto: 'Envia vídeos com legenda e as opções que quem posta escolhe: quem pode ver, comentários, dueto e costura.',
  },
]

const PASSOS = [
  { icone: PlugZap, titulo: 'Conecte a conta', texto: 'Pelo login oficial de cada rede. O Spool só recebe o que você autoriza na tela da própria rede.' },
  { icone: CalendarClock, titulo: 'Agende', texto: 'Escolha o arquivo, o texto, a data e a hora. Tudo fica num calendário da semana e do mês.' },
  { icone: CheckCircle2, titulo: 'Publicado e conferido', texto: 'Na hora marcada o post sai pela API oficial, e o Spool confere na rede antes de marcar como publicado.' },
]

export default function SpoolPage() {
  return (
    <>
      {/* Abertura */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-14 sm:pt-24">
        <span className="badge">
          <span className="badge-dot text-accent" aria-hidden />
          Em produção · acesso por convite
        </span>
        <h1 className="mt-6 text-4xl sm:text-6xl font-semibold tracking-[-0.03em] leading-[1.05] max-w-3xl">
          Seus posts no ar <span className="text-muted">na hora certa.</span>
        </h1>
        <p className="mt-6 text-lg text-muted leading-relaxed max-w-2xl">
          O Spool agenda publicações no YouTube, no Instagram, em páginas do LinkedIn e no TikTok, sempre pelas APIs
          oficiais de cada rede. Ele já publica todos os dias nas contas que a Marcai administra. Novos usuários
          entram por convite: fale com a gente em {EMPRESA.email}.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {/* o único botão principal da tela */}
          <Link href="/spool/privacidade" className="btn btn-primary btn-lg">
            Política de privacidade <ArrowRight size={16} strokeWidth={1.8} aria-hidden />
          </Link>
          <Link href="/spool/termos" className="btn btn-lg">
            Termos de uso
          </Link>
        </div>
      </section>

      {/* Redes */}
      <section className="max-w-5xl mx-auto px-6" aria-labelledby="redes">
        <h2 id="redes" className="text-xl font-semibold tracking-[-0.01em] mb-4">O que ele faz em cada rede</h2>
        <div className="grid gap-[14px] sm:grid-cols-2">
          {REDES.map(({ nome, icone: Icone, texto }) => (
            <div key={nome} className="card">
              <div className="flex items-center gap-3">
                <span className="tile-ico">
                  <Icone size={18} strokeWidth={1.8} aria-hidden />
                </span>
                <h3 className="t-section text-[17px]">{nome}</h3>
              </div>
              <p className="mt-3 text-[15px] text-muted leading-relaxed">{texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section className="max-w-5xl mx-auto px-6 mt-16" aria-labelledby="como">
        <h2 id="como" className="text-xl font-semibold tracking-[-0.01em] mb-4">Como funciona</h2>
        <ol className="grid gap-[14px] md:grid-cols-3">
          {PASSOS.map(({ icone: Icone, titulo, texto }, i) => (
            <li key={titulo} className="card">
              <div className="flex items-center justify-between">
                <span className="tile-ico">
                  <Icone size={18} strokeWidth={1.8} aria-hidden />
                </span>
                <span className="text-sm font-semibold text-faint tabular">0{i + 1}</span>
              </div>
              <h3 className="t-section mt-4">{titulo}</h3>
              <p className="mt-2 text-[15px] text-muted leading-relaxed">{texto}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Privacidade: o cartão principal da tela, o único com a mancha da cor */}
      <section className="max-w-5xl mx-auto px-6 mt-16">
        <div className="card card-hero sm:p-10 grid gap-6 md:grid-cols-[auto_1fr] md:items-start">
          <span className="tile-ico">
            <Lock size={18} strokeWidth={1.8} aria-hidden />
          </span>
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.02em]">Seus dados ficam com você.</h2>
            <p className="mt-3 text-muted leading-relaxed max-w-2xl">
              O Spool roda no computador de quem usa. Os posts e o histórico ficam num banco de dados local, e os acessos
              às contas ficam no Chaveiro do macOS. Não existem servidores do Spool: os dados só vão para a própria rede,
              para fazer o que foi pedido. Nada é vendido, compartilhado ou usado para publicidade.
            </p>
            <Link href="/spool/privacidade" className="link mt-4 inline-flex items-center gap-1.5 text-sm">
              Ler a política de privacidade <ArrowRight size={15} strokeWidth={1.8} aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* Empresa + resumo em inglês (para as equipes de revisão das redes) */}
      <section className="max-w-5xl mx-auto px-6 mt-16 grid gap-[14px] md:grid-cols-2">
        <div className="card">
          <h2 className="t-caps">Quem faz</h2>
          <p className="mt-3 font-semibold">{EMPRESA.razao}</p>
          <dl className="mt-2 space-y-1 text-[15px] text-muted">
            <div><dt className="inline">CNPJ: </dt><dd className="inline">{EMPRESA.cnpj}</dd></div>
            <div><dt className="sr-only">Endereço</dt><dd>{EMPRESA.endereco}</dd></div>
            <div>
              <dt className="inline">Contato: </dt>
              <dd className="inline"><a className="link" href={`mailto:${EMPRESA.email}`}>{EMPRESA.email}</a></dd>
            </div>
          </dl>
        </div>
        <div className="card" lang="en">
          <h2 className="t-caps">In English</h2>
          <p className="mt-3 text-[15px] text-muted leading-relaxed">
            Spool is a social media scheduler by {EMPRESA.razao} (Brazil, CNPJ {EMPRESA.cnpj}). It schedules posts to
            YouTube, Instagram, LinkedIn Pages and TikTok through each network&apos;s official API and shows basic post
            analytics. It is in production: Marcai uses it every day to publish on the accounts it manages. New users join by
            invitation (contact {EMPRESA.email}). See the{' '}
            <Link className="link" href="/spool/privacidade#en">Privacy Policy</Link> and{' '}
            <Link className="link" href="/spool/termos#en">Terms of Service</Link>.
          </p>
        </div>
      </section>
    </>
  )
}
