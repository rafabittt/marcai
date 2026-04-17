import Link from 'next/link'
import FeaturesSection from './components/FeaturesSection'
import PricingSection from './components/PricingSection'
import FAQSection from './components/FAQSection'
import LandingFooter from './components/LandingFooter'
import LandingHeader from './components/LandingHeader'
import { Link2, Smartphone, MessageCircle } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      <LandingHeader />

      {/* ── HERO ── */}
      <section className="bg-white pt-16 pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Texto */}
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-8 bg-[#dcfce7] text-[#128C7E]">
                ✦ Agendamentos com WhatsApp
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight mb-6" style={{ color: '#0a0a0a' }}>
                Agendamentos<br />
                simples.<br />
                <span className="text-[#25D366]">Clientes felizes.</span>
              </h1>

              <p className="text-lg text-gray-500 max-w-md mb-10 leading-relaxed">
                Crie seu link de agendamento em minutos. Seus clientes agendam pelo celular, você recebe confirmação no WhatsApp.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link
                  href="/login?modo=cadastro"
                  className="text-sm font-semibold px-7 py-4 rounded-xl text-white bg-[#25D366] transition-all duration-200 hover:bg-[#128C7E] hover:scale-[1.02] text-center"
                >
                  Criar meu link grátis
                </Link>
                <a
                  href="#como-funciona"
                  className="text-sm font-semibold px-7 py-4 rounded-xl border border-gray-200 text-gray-600 transition-all duration-200 hover:bg-gray-50 hover:scale-[1.02] text-center"
                >
                  Ver como funciona
                </a>
              </div>

              <div className="flex flex-wrap gap-5 text-sm text-gray-600">
                <span className="flex items-center gap-1.5">
                  <span className="text-[#25D366]">✓</span> Grátis para começar
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-[#25D366]">✓</span> Sem cartão de crédito
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-[#25D366]">✓</span> WhatsApp incluso
                </span>
              </div>
            </div>

            {/* Mock visual do produto */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                {/* Sombra decorativa */}
                <div className="absolute inset-0 translate-x-4 translate-y-4 bg-[#dcfce7] rounded-3xl" />

                {/* Card principal — formulário de agendamento */}
                <div className="relative bg-white rounded-3xl shadow-xl border border-gray-100 w-80 overflow-hidden">

                  {/* Cabeçalho do card */}
                  <div className="px-6 pt-6 pb-4 border-b border-gray-50">
                    <p className="text-xs font-bold text-[#25D366] mb-1">Marcaí</p>
                    <p className="text-base font-bold text-gray-900">Barbearia do Zeca</p>
                    <p className="text-xs text-gray-500 mt-0.5">Preencha para agendar</p>
                  </div>

                  {/* Campos do formulário */}
                  <div className="px-6 py-5 space-y-3">
                    {[
                      { label: 'SEU NOME', value: 'João Silva', done: true },
                      { label: 'SERVIÇO', value: 'Corte + Barba', done: true },
                      { label: 'DATA', value: 'Amanhã, 10:00', done: true },
                    ].map(f => (
                      <div key={f.label}>
                        <p className="text-[10px] font-semibold tracking-widest text-gray-500 mb-1">{f.label}</p>
                        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5">
                          <span className="text-sm text-gray-700">{f.value}</span>
                          {f.done && <span className="text-[#25D366] text-xs">✓</span>}
                        </div>
                      </div>
                    ))}

                    <div className="pt-1">
                      <div className="w-full py-3 rounded-xl text-sm font-semibold text-white text-center bg-[#25D366]">
                        Confirmar agendamento
                      </div>
                    </div>
                  </div>

                  {/* Notificação WhatsApp flutuante */}
                  <div className="mx-4 mb-5 bg-[#dcfce7] rounded-2xl p-3 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
                      <MessageCircle size={20} color="white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-700">WhatsApp</p>
                      <p className="text-xs text-gray-500 leading-relaxed">Agendamento confirmado para amanhã às 10h! 🗓️</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <div id="recursos">
        <FeaturesSection />
      </div>

      {/* ── COMO FUNCIONA ── */}
      <section id="como-funciona" className="py-32 px-6 bg-white">
        <div className="max-w-4xl mx-auto">

          <div className="mb-20">
            <p className="text-xs uppercase tracking-widest font-semibold mb-4 text-[#25D366]">
              Como funciona
            </p>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight" style={{ color: '#0a0a0a' }}>
              Do cadastro ao<br />primeiro agendamento<br />em minutos.
            </h2>
          </div>

          <div className="space-y-0">
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
            ].map((step, i) => (
              <div
                key={step.num}
                className={`grid gap-6 md:gap-10 items-start py-10 md:py-12 ${i < 2 ? 'border-b border-gray-100' : ''}`}
                style={{ gridTemplateColumns: 'auto 1fr' }}
              >
                <span
                  className="text-5xl md:text-8xl font-bold leading-none select-none"
                  style={{ color: '#25D366', opacity: 0.2 }}
                >
                  {step.num}
                </span>
                <div className="flex-1 pt-1 md:pt-3">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#dcfce7' }}
                    >
                      <step.Icon size={18} color="#128C7E" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold" style={{ color: '#0a0a0a' }}>{step.title}</h3>
                  </div>
                  <p className="text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FAQSection />

      <PricingSection />

      {/* ── CTA FINAL ── */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-6" style={{ color: '#0a0a0a' }}>
            Pronto para simplificar seus agendamentos?
          </h2>
          <p className="text-gray-500 text-lg mb-10">
            Comece grátis hoje. Nenhum cartão de crédito necessário.
          </p>
          <Link
            href="/login?modo=cadastro"
            className="inline-block text-sm font-semibold px-10 py-4 rounded-xl text-white bg-[#25D366] transition-all duration-200 hover:bg-[#128C7E] hover:scale-[1.02]"
          >
            Criar minha conta grátis
          </Link>
        </div>
      </section>

      <LandingFooter />

    </div>
  )
}
