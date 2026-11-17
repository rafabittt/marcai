import Link from 'next/link'
import { Youtube, Instagram, Linkedin, Music2, PlugZap, CalendarClock, CheckCircle2, Lock, ArrowRight } from 'lucide-react'
import { EMPRESA, POPPINS } from './_components/empresa'

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
        <span className="inline-flex items-center gap-2 rounded-full border border-[#EBDAC6] bg-white/70 px-3 py-1 text-xs font-medium text-[#5F5850]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#FF7A00]" aria-hidden />
          Em testes · uso interno da Marcai
        </span>
        <h1 className="mt-6 text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05] max-w-3xl" style={POPPINS}>
          Seus posts no ar <span className="text-[#A34700]">na hora certa.</span>
        </h1>
        <p className="mt-6 text-lg text-[#5F5850] leading-relaxed max-w-2xl">
          O Spool agenda publicações no YouTube, no Instagram, em páginas do LinkedIn e no TikTok, sempre pelas APIs
          oficiais de cada rede. Hoje ele é usado só nas contas que a própria Marcai administra e ainda não é
          oferecido ao público.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/spool/privacidade"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-[#141414] transition-[filter] hover:brightness-105"
            style={{
              background: 'linear-gradient(180deg, #FF9534 0%, #FF7A00 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,.38), 0 1px 2px rgba(163,71,0,.22), 0 4px 14px -6px rgba(255,122,0,.55)',
            }}
          >
            Política de privacidade <ArrowRight size={16} aria-hidden />
          </Link>
          <Link
            href="/spool/termos"
            className="inline-flex items-center rounded-xl border border-[#EBDAC6] bg-white px-5 py-3 text-sm font-semibold text-[#141414] hover:border-[#D9C2A8] transition-colors"
          >
            Termos de uso
          </Link>
        </div>
      </section>

      {/* Redes */}
      <section className="max-w-5xl mx-auto px-6" aria-labelledby="redes">
        <h2 id="redes" className="text-xs font-semibold uppercase tracking-widest text-[#7A7167] mb-4">O que ele faz em cada rede</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {REDES.map(({ nome, icone: Icone, texto }) => (
            <div
              key={nome}
              className="rounded-2xl border border-[#EBDAC6] p-6"
              style={{ background: 'radial-gradient(120% 95% at 100% 0%, rgba(255,122,0,.10) 0%, transparent 62%), #FFFFFF' }}
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFF4E8] text-[#A34700]">
                  <Icone size={20} aria-hidden />
                </span>
                <h3 className="text-lg font-semibold" style={POPPINS}>{nome}</h3>
              </div>
              <p className="mt-3 text-[15px] text-[#5F5850] leading-relaxed">{texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section className="max-w-5xl mx-auto px-6 mt-16" aria-labelledby="como">
        <h2 id="como" className="text-xs font-semibold uppercase tracking-widest text-[#7A7167] mb-4">Como funciona</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {PASSOS.map(({ icone: Icone, titulo, texto }, i) => (
            <li key={titulo} className="rounded-2xl border border-[#EBDAC6] bg-white/70 p-6">
              <div className="flex items-center justify-between">
                <Icone size={22} className="text-[#A34700]" aria-hidden />
                <span className="text-sm font-semibold text-[#C9B39A]" style={POPPINS}>0{i + 1}</span>
              </div>
              <h3 className="mt-4 font-semibold" style={POPPINS}>{titulo}</h3>
              <p className="mt-2 text-[15px] text-[#5F5850] leading-relaxed">{texto}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Privacidade (bloco escuro, como o destaque do app) */}
      <section className="max-w-5xl mx-auto px-6 mt-16">
        <div className="rounded-3xl bg-[#141414] text-[#F4EFE9] p-8 sm:p-10 grid gap-6 md:grid-cols-[auto_1fr] md:items-start">
          <span className="grid h-12 w-12 place-items-center rounded-2xl text-[#141414]" style={{ background: 'linear-gradient(140deg, #FFA34D 0%, #FF7A00 48%, #F25C00 100%)' }}>
            <Lock size={22} aria-hidden />
          </span>
          <div>
            <h2 className="text-2xl font-bold tracking-tight" style={POPPINS}>Seus dados ficam com você.</h2>
            <p className="mt-3 text-[#CFC6BB] leading-relaxed max-w-2xl">
              O Spool roda no computador de quem usa. Os posts e o histórico ficam num banco de dados local, e os acessos
              às contas ficam no Chaveiro do macOS. Não existem servidores do Spool: os dados só vão para a própria rede,
              para fazer o que foi pedido. Nada é vendido, compartilhado ou usado para publicidade.
            </p>
            <Link href="/spool/privacidade" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#FF9F47] hover:text-[#FFB570]">
              Ler a política de privacidade <ArrowRight size={15} aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* Empresa + resumo em inglês (para as equipes de revisão das redes) */}
      <section className="max-w-5xl mx-auto px-6 mt-16 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[#EBDAC6] bg-white/70 p-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#7A7167]">Quem faz</h2>
          <p className="mt-3 font-semibold" style={POPPINS}>{EMPRESA.razao}</p>
          <dl className="mt-2 space-y-1 text-[15px] text-[#5F5850]">
            <div><dt className="inline">CNPJ: </dt><dd className="inline">{EMPRESA.cnpj}</dd></div>
            <div><dt className="sr-only">Endereço</dt><dd>{EMPRESA.endereco}</dd></div>
            <div>
              <dt className="inline">Contato: </dt>
              <dd className="inline"><a className="text-[#A34700] underline underline-offset-2" href={`mailto:${EMPRESA.email}`}>{EMPRESA.email}</a></dd>
            </div>
          </dl>
        </div>
        <div className="rounded-2xl border border-[#EBDAC6] bg-white/70 p-6" lang="en">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#7A7167]">In English</h2>
          <p className="mt-3 text-[15px] text-[#5F5850] leading-relaxed">
            Spool is a social media scheduler by {EMPRESA.razao} (Brazil, CNPJ {EMPRESA.cnpj}). It schedules posts to
            YouTube, Instagram, LinkedIn Pages and TikTok through each network&apos;s official API and shows basic post
            analytics. It is currently in testing, used only for accounts Marcai manages, and not offered to the public
            yet. See the{' '}
            <Link className="text-[#A34700] underline underline-offset-2" href="/spool/privacidade#en">Privacy Policy</Link> and{' '}
            <Link className="text-[#A34700] underline underline-offset-2" href="/spool/termos#en">Terms of Service</Link>.
          </p>
        </div>
      </section>
    </>
  )
}
