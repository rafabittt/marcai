'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const plans = [
  {
    name: 'Básico',
    price: 'R$79',
    items: ['1 profissional', 'Link de agendamento', 'Confirmação WhatsApp', 'Lembrete automático'],
    highlight: false,
    cta: 'Começar agora',
    ctaClass: 'block text-center text-sm font-semibold py-3 rounded-xl border border-gray-200 text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:scale-[1.02]',
    cardClass: 'bg-white rounded-2xl p-8 border border-gray-100 text-left hover:shadow-md transition-shadow',
    priceClass: 'text-5xl font-bold',
    priceStyle: { color: '#0a0a0a' } as React.CSSProperties,
    listClass: 'space-y-3 text-sm text-gray-700 mb-8',
    itemClass: 'flex items-center gap-2.5',
  },
  {
    name: 'Pro',
    price: 'R$149',
    items: ['Até 3 profissionais', 'Tudo do Básico', 'Relatório mensal', 'Suporte prioritário'],
    highlight: true,
    cta: 'Começar agora',
    ctaClass: 'block text-center text-sm font-semibold py-3 rounded-xl bg-[#25D366] text-white transition-all duration-200 hover:bg-[#128C7E] hover:scale-[1.02]',
    cardClass: 'rounded-2xl p-8 text-left relative bg-gray-900',
    priceClass: 'text-5xl font-bold text-white',
    priceStyle: {} as React.CSSProperties,
    listClass: 'space-y-3 text-sm mb-8',
    itemClass: 'flex items-center gap-2.5 text-gray-500',
  },
  {
    name: 'Clínica',
    price: 'R$299',
    items: ['Profissionais ilimitados', 'Tudo do Pro', 'Onboarding dedicado'],
    highlight: false,
    cta: 'Começar agora',
    ctaClass: 'block text-center text-sm font-semibold py-3 rounded-xl border border-gray-200 text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:scale-[1.02]',
    cardClass: 'bg-white rounded-2xl p-8 border border-gray-100 text-left hover:shadow-md transition-shadow',
    priceClass: 'text-5xl font-bold',
    priceStyle: { color: '#0a0a0a' } as React.CSSProperties,
    listClass: 'space-y-3 text-sm text-gray-700 mb-8',
    itemClass: 'flex items-center gap-2.5',
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
      { threshold: 0.15 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="precos" className="py-32 px-6" style={{ backgroundColor: '#f9f9f9' }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-16">
          <p className="text-xs uppercase tracking-widest font-semibold mb-4 text-[#25D366]">
            Preços
          </p>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight" style={{ color: '#0a0a0a' }}>
            Simples e transparente.
          </h2>
          <p className="text-gray-500 text-lg mt-4">Sem taxas escondidas. Cancele quando quiser.</p>
        </div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className={plan.cardClass}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(40px)',
                transition: `opacity 0.55s ease ${i * 0.15}s, transform 0.55s ease ${i * 0.15}s`,
              }}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-6 bg-[#25D366] text-white text-xs font-bold px-3 py-1 rounded-full">
                  Mais popular
                </span>
              )}
              <p className="text-sm font-semibold text-gray-500 mb-3">{plan.name}</p>
              <div className="flex items-end gap-1 mb-6">
                <p className={plan.priceClass} style={plan.priceStyle}>{plan.price}</p>
                <p className="text-sm text-gray-500 mb-2">/mês</p>
              </div>
              <ul className={plan.listClass}>
                {plan.items.map(item => (
                  <li key={item} className={plan.itemClass}>
                    <span className="text-[#25D366] font-bold">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link href="/login?modo=cadastro" className={plan.ctaClass}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
