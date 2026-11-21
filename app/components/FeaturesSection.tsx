'use client'

import { useEffect, useRef, useState } from 'react'
import { Link2, MessageCircle, LayoutDashboard } from 'lucide-react'

const features = [
  {
    Icon: Link2,
    title: 'Seu link único',
    desc: 'Compartilhe um link e seus clientes agendam na hora, sem ligação, sem confusão.',
    whatsapp: false,
    badge: null as string | null,
  },
  {
    Icon: MessageCircle,
    title: 'Confirmação automática',
    desc: 'Cada agendamento gera uma mensagem automática no WhatsApp do cliente e do seu negócio.',
    whatsapp: true,
    badge: 'Incluso em todos os planos',
  },
  {
    Icon: LayoutDashboard,
    title: 'Dashboard em tempo real',
    desc: 'Veja todos os agendamentos do dia num painel simples e organizado.',
    whatsapp: false,
    badge: null as string | null,
  },
]

export default function FeaturesSection() {
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
    <section className="py-12 md:py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-[14px]">
          {features.map((f, i) => (
            <div
              key={f.title}
              // O cartão do WhatsApp é o principal da seção: só ele leva a mancha verde.
              className={`card md:!p-7 flex flex-col ${f.whatsapp ? 'card-hero' : ''}`}
              style={{
                // Entrada curta (Grafite: até 280ms, só opacity/transform).
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(12px)',
                transition: `opacity 280ms var(--ease-out) ${i * 60}ms, transform 280ms var(--ease-out) ${i * 60}ms`,
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                <div className="tile-ico">
                  <f.Icon size={18} strokeWidth={1.8} aria-hidden />
                </div>
                {f.badge && <span className="badge badge-accent">{f.badge}</span>}
              </div>

              <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-fg mb-1.5">{f.title}</h3>
              <p className="text-[15px] text-muted leading-relaxed">{f.desc}</p>

              {/* Nota WhatsApp */}
              {f.whatsapp && (
                <p className="t-cap mt-4">
                  Sem custo extra. Funciona com WhatsApp pessoal ou Business.
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
