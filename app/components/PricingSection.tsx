'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'

// Os valores, nomes e recursos dos planos são os mesmos de sempre: aqui só
// muda a apresentação. O plano em destaque é o único cartão com a mancha verde
// (.card-hero) e o único botão preto da seção.
const plans = [
  {
    name: 'Freemium',
    price: 'R$0',
    idealFor: 'Quem quer testar antes de assinar',
    items: [
      '1 profissional',
      'Link de agendamento',
      'Até 5 agendamentos/mês',
      'Confirmação WhatsApp',
    ],
    highlight: false,
    badge: null as string | null,
    cta: 'Começar grátis',
    ctaHref: '/login?modo=cadastro',
  },
  {
    name: 'Básico',
    price: 'R$49',
    idealFor: 'Autônomo ou 1 cadeira',
    items: [
      '1 profissional',
      'Link de agendamento',
      'Confirmação WhatsApp',
      'Lembrete automático',
    ],
    highlight: false,
    badge: null as string | null,
    cta: 'Escolher este plano',
    ctaHref: '/assinar?plano=basico',
  },
  {
    name: 'Pro',
    price: 'R$99',
    idealFor: 'Negócio com 2–3 profissionais',
    items: [
      'Até 3 profissionais',
      'Tudo do Básico',
      'Relatório mensal',
      'Suporte prioritário',
    ],
    highlight: true,
    badge: 'Mais escolhido',
    cta: 'Escolher este plano',
    ctaHref: '/assinar?plano=pro',
  },
  {
    name: 'Prime',
    price: 'R$299',
    idealFor: 'Negócio em crescimento com equipe',
    items: [
      'Profissionais ilimitados',
      'Tudo do Pro',
      'Onboarding dedicado',
    ],
    highlight: false,
    badge: null as string | null,
    cta: 'Escolher este plano',
    ctaHref: '/assinar?plano=prime',
  },
]

export default function PricingSection() {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="precos" className="scroll-mt-20 py-20 md:py-28 px-6">
      <div className="max-w-6xl mx-auto">

        <div className="mb-10 md:mb-14">
          <p className="t-caps mb-4">
            Preços
          </p>
          <h2 className="text-[32px] md:text-[44px] font-semibold leading-[1.1] tracking-[-0.03em] text-fg">
            Simples e transparente.
          </h2>
          <p className="text-muted text-lg mt-4">Sem taxas escondidas. Cancele quando quiser.</p>
        </div>

        <div
          ref={ref}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[14px]"
        >
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className={`card md:!p-6 flex flex-col ${plan.highlight ? 'card-hero' : ''}`}
              style={{
                // Entrada curta (Grafite: até 280ms, só opacity/transform).
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(12px)',
                transition: `opacity 280ms var(--ease-out) ${i * 60}ms, transform 280ms var(--ease-out) ${i * 60}ms`,
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-2 min-h-[22px]">
                <p className="t-label">{plan.name}</p>
                {plan.badge && <span className="badge badge-accent">{plan.badge}</span>}
              </div>

              <p className="t-num mb-2">
                {plan.price}<small> /mês</small>
              </p>

              {/* Ideal para */}
              <p className="t-cap mb-5">
                Ideal para: {plan.idealFor}
              </p>

              <ul className="space-y-2.5 text-sm text-fg mb-7 border-t border-hairline pt-5">
                {plan.items.map(item => (
                  <li key={item} className="flex items-center gap-2.5">
                    <Check size={14} strokeWidth={2} className="text-accent-ink flex-shrink-0" aria-hidden /> {item}
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <Link
                  href={plan.ctaHref}
                  className={`btn btn-block ${plan.highlight ? 'btn-primary' : ''}`}
                >
                  {plan.cta}
                </Link>

                <p className="t-cap text-center mt-3">
                  Sem contrato. Cancele quando quiser.
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
