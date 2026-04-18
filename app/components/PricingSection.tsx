'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

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
    cardClass: 'bg-white rounded-2xl p-7 border border-gray-100 text-left hover:shadow-md transition-shadow relative',
    priceClass: 'text-4xl font-bold',
    priceStyle: { color: '#0a0a0a' } as React.CSSProperties,
    labelClass: 'text-sm font-semibold text-gray-500',
    idealForClass: 'text-[#128C7E]',
    listClass: 'space-y-2.5 text-sm text-gray-700 mb-7',
    itemClass: 'flex items-center gap-2.5',
    ctaClass:
      'block text-center text-sm font-semibold py-3 rounded-xl border border-gray-200 text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:scale-[1.02]',
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
    ctaHref: '/login?modo=cadastro',
    cardClass: 'bg-white rounded-2xl p-7 border border-gray-100 text-left hover:shadow-md transition-shadow relative',
    priceClass: 'text-4xl font-bold',
    priceStyle: { color: '#0a0a0a' } as React.CSSProperties,
    labelClass: 'text-sm font-semibold text-gray-500',
    idealForClass: 'text-[#128C7E]',
    listClass: 'space-y-2.5 text-sm text-gray-700 mb-7',
    itemClass: 'flex items-center gap-2.5',
    ctaClass:
      'block text-center text-sm font-semibold py-3 rounded-xl border border-gray-200 text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:scale-[1.02]',
  },
  {
    name: 'Pro',
    price: 'R$99',
    idealFor: 'Salão com 2–3 profissionais',
    items: [
      'Até 3 profissionais',
      'Tudo do Básico',
      'Relatório mensal',
      'Suporte prioritário',
    ],
    highlight: true,
    badge: 'Mais escolhido',
    cta: 'Escolher este plano',
    ctaHref: '/login?modo=cadastro',
    cardClass: 'rounded-2xl p-7 text-left relative bg-gray-900',
    priceClass: 'text-4xl font-bold text-white',
    priceStyle: {} as React.CSSProperties,
    labelClass: 'text-sm font-semibold text-gray-400',
    idealForClass: 'text-[#25D366]',
    listClass: 'space-y-2.5 text-sm mb-7',
    itemClass: 'flex items-center gap-2.5 text-gray-300',
    ctaClass:
      'block text-center text-sm font-semibold py-3 rounded-xl bg-[#25D366] text-white transition-all duration-200 hover:bg-[#128C7E] hover:scale-[1.02]',
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
    ctaHref: '/login?modo=cadastro',
    cardClass: 'bg-white rounded-2xl p-7 border border-gray-100 text-left hover:shadow-md transition-shadow relative',
    priceClass: 'text-4xl font-bold',
    priceStyle: { color: '#0a0a0a' } as React.CSSProperties,
    labelClass: 'text-sm font-semibold text-gray-500',
    idealForClass: 'text-[#128C7E]',
    listClass: 'space-y-2.5 text-sm text-gray-700 mb-7',
    itemClass: 'flex items-center gap-2.5',
    ctaClass:
      'block text-center text-sm font-semibold py-3 rounded-xl border border-gray-200 text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:scale-[1.02]',
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
    <section id="precos" className="py-32 px-6" style={{ backgroundColor: '#f9f9f9' }}>
      <div className="max-w-6xl mx-auto">

        <div className="mb-16">
          <p className="text-xs uppercase tracking-widest font-semibold mb-4 text-[#25D366]">
            Preços
          </p>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight" style={{ color: '#0a0a0a' }}>
            Simples e transparente.
          </h2>
          <p className="text-gray-500 text-lg mt-4">Sem taxas escondidas. Cancele quando quiser.</p>
        </div>

        <div
          ref={ref}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start"
        >
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className={plan.cardClass}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(40px)',
                transition: `opacity 0.55s ease ${i * 0.12}s, transform 0.55s ease ${i * 0.12}s`,
              }}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-6 bg-[#25D366] text-white text-xs font-bold px-3 py-1 rounded-full">
                  {plan.badge}
                </span>
              )}

              <p className={plan.labelClass + ' mb-1'}>{plan.name}</p>

              <div className="flex items-end gap-1 mb-2">
                <p className={plan.priceClass} style={plan.priceStyle}>{plan.price}</p>
                <p className={`text-sm mb-1.5 ${plan.highlight ? 'text-gray-400' : 'text-gray-500'}`}>/mês</p>
              </div>

              {/* Ideal para */}
              <p className={`text-xs font-medium mb-5 ${plan.idealForClass}`}>
                Ideal para: {plan.idealFor}
              </p>

              <ul className={plan.listClass}>
                {plan.items.map(item => (
                  <li key={item} className={plan.itemClass}>
                    <span className="text-[#25D366] font-bold flex-shrink-0">✓</span> {item}
                  </li>
                ))}
              </ul>

              <Link href={plan.ctaHref} className={plan.ctaClass}>
                {plan.cta}
              </Link>

              <p className={`text-xs text-center mt-3 ${plan.highlight ? 'text-gray-500' : 'text-gray-400'}`}>
                Sem contrato. Cancele quando quiser.
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
