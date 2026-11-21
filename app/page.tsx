import Link from 'next/link'
import FeaturesSection from './components/FeaturesSection'
import PricingSection from './components/PricingSection'
import FAQSection from './components/FAQSection'
import LandingFooter from './components/LandingFooter'
import LandingHeader from './components/LandingHeader'
import MetaPixel from './components/MetaPixel'
import { Link2, Smartphone, MessageCircle, Check, MessageSquare } from 'lucide-react'

// Página de marca no Grafite: fundo cinza do body, seções soltas em cima dele,
// cartões brancos. Títulos maiores que no app (é vitrine), mas sempre fonte do
// sistema em semibold, tracking apertado. Um botão preto principal por bloco.

export default function LandingPage() {
  return (
    <div className="min-h-screen">

      <LandingHeader />

      {/* ── HERO ── */}
      <section className="pt-14 pb-20 md:pt-20 md:pb-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-16 items-center">

            {/* Texto */}
            <div>
              <span className="badge mb-7">
                <MessageSquare size={12} strokeWidth={1.8} aria-hidden /> Confirmação via WhatsApp
              </span>

              {/* No celular a fonte acompanha a largura da tela: "Agendamentos" é
                  uma palavra só, não quebra, e um tamanho fixo grande cortava na
                  lateral em 360, 390 e 414px. A partir de ~460px chega aos 48px. */}
              <h1 className="text-[clamp(2rem,10.5vw,3rem)] md:text-[56px] lg:text-[64px] font-semibold leading-[1.05] tracking-[-0.03em] text-fg mb-6">
                Agendamentos<br />
                simples.<br />
                <span className="text-accent-ink">Clientes felizes.</span>
              </h1>

              <p className="text-lg text-muted max-w-md mb-9 leading-relaxed">
                Crie seu link de agendamento em minutos. Seus clientes agendam pelo celular, você recebe confirmação no WhatsApp.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-9">
                <Link href="/login?modo=cadastro" className="btn btn-primary btn-lg btn-block sm:w-auto">
                  Criar meu link grátis
                </Link>
                <a href="#como-funciona" className="btn btn-lg btn-block sm:w-auto">
                  Ver como funciona
                </a>
              </div>

              <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
                {['Grátis para começar', 'Sem cartão de crédito', 'WhatsApp incluso'].map(t => (
                  <li key={t} className="flex items-center gap-1.5">
                    <Check size={14} strokeWidth={2} className="text-accent-ink" aria-hidden /> {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Mock do produto: a tela pública de agendamento, em cartão Grafite.
                É ilustração, por isso fica escondido do leitor de tela. */}
            <div className="flex justify-center lg:justify-end" aria-hidden="true">
              <div className="card w-full max-w-[340px] !p-0">

                {/* Cabeçalho do cartão */}
                <div className="px-5 pt-5 pb-4 border-b border-hairline">
                  <p className="t-cap font-medium mb-1">Marcaí</p>
                  <p className="text-[17px] font-semibold tracking-[-0.01em] text-fg">Barbearia do Zeca</p>
                  <p className="t-cap mt-0.5">Preencha para agendar</p>
                </div>

                {/* Campos do formulário */}
                <div className="px-5 py-5 space-y-3">
                  {[
                    { label: 'Seu nome', value: 'João Silva', done: true },
                    { label: 'Serviço', value: 'Corte + Barba', done: true },
                    { label: 'Data', value: 'Amanhã, 10:00', done: true },
                  ].map(f => (
                    <div key={f.label}>
                      <p className="field-label">{f.label}</p>
                      <div className="field flex items-center justify-between">
                        <span className="text-[15px] text-fg">{f.value}</span>
                        {f.done && <Check size={14} strokeWidth={2} className="text-accent-ink" />}
                      </div>
                    </div>
                  ))}

                  <div className="pt-1">
                    <div className="btn btn-primary btn-block">
                      Confirmar agendamento
                    </div>
                  </div>
                </div>

                {/* Notificação do WhatsApp: uma linha com quadradinho de ícone */}
                <div className="flex items-start gap-3 px-5 py-4 border-t border-hairline">
                  <div className="tile-ico bg-accent-soft text-accent-ink">
                    <MessageCircle size={18} strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-fg">WhatsApp</p>
                    <p className="t-cap leading-relaxed">Agendamento confirmado para amanhã às 10h!</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <div id="recursos" className="scroll-mt-20">
        <FeaturesSection />
      </div>

      {/* ── COMO FUNCIONA ── */}
      <section id="como-funciona" className="scroll-mt-20 pt-20 md:pt-28 pb-12 px-6">
        <div className="max-w-4xl mx-auto">

          <div className="mb-10 md:mb-14">
            <p className="t-caps mb-4">Como funciona</p>
            <h2 className="text-[32px] md:text-[44px] font-semibold leading-[1.1] tracking-[-0.03em] text-fg">
              Do cadastro ao<br />primeiro agendamento<br />em minutos.
            </h2>
          </div>

          <ol className="card !px-6 !py-2 md:!px-8">
            {[
              {
                num: '01',
                Icon: Link2,
                title: 'Você cria seu link de agendamento',
                desc: 'Cadastre seu negócio, defina o tipo de serviço e receba um link personalizado pronto para compartilhar.',
              },
              {
                num: '02',
                Icon: Smartphone,
                title: 'Cliente acessa e agenda em segundos',
                desc: 'O cliente abre o link pelo celular, preenche nome, serviço e horário — sem app, sem cadastro, sem complicação.',
              },
              {
                num: '03',
                Icon: MessageCircle,
                title: 'Você recebe confirmação no WhatsApp',
                desc: 'Na hora do agendamento, você e o cliente recebem uma mensagem automática de confirmação. Simples assim.',
              },
            ].map(step => (
              <li
                key={step.num}
                className="flex items-start gap-4 md:gap-5 py-6 md:py-7 border-t border-hairline first:border-t-0"
              >
                <div className="tile-ico">
                  <step.Icon size={18} strokeWidth={1.8} aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="t-caps tabular mb-1">{step.num}</p>
                  <h3 className="text-[17px] md:text-lg font-semibold tracking-[-0.01em] text-fg mb-1.5">{step.title}</h3>
                  <p className="text-muted leading-relaxed">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <FAQSection />

      <PricingSection />

      {/* ── CTA FINAL ── */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-[32px] md:text-[44px] font-semibold leading-[1.1] tracking-[-0.03em] text-fg mb-5">
            Pronto para simplificar seus agendamentos?
          </h2>
          <p className="text-muted text-lg mb-9">
            Comece grátis hoje. Nenhum cartão de crédito necessário.
          </p>
          <Link href="/login?modo=cadastro" className="btn btn-primary btn-lg">
            Criar minha conta grátis
          </Link>
        </div>
      </section>

      <LandingFooter />

      {/* Pixel + banner de consentimento. Só aqui e no cadastro do /login. */}
      <MetaPixel />

    </div>
  )
}
