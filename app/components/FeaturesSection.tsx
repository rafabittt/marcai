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
    <section className="py-24 px-6" style={{ backgroundColor: '#f9f9f9' }}>
      <div className="max-w-6xl mx-auto">
        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl p-8 border transition-shadow relative"
              style={{
                borderColor: f.whatsapp ? '#25D366' : '#f3f4f6',
                borderWidth: f.whatsapp ? '2px' : '1px',
                boxShadow: f.whatsapp ? '0 4px 24px rgba(37,211,102,0.12)' : undefined,
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(40px)',
                transition: `opacity 0.55s ease ${i * 0.15}s, transform 0.55s ease ${i * 0.15}s`,
              }}
            >
              {/* Badge WhatsApp */}
              {f.badge && (
                <span
                  className="absolute -top-3 left-6 text-xs font-bold px-3 py-1 rounded-full text-white"
                  style={{ backgroundColor: '#25D366' }}
                >
                  {f.badge}
                </span>
              )}

              {/* Ícone */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 relative"
                style={{ backgroundColor: f.whatsapp ? '#25D366' : '#25D366' }}
              >
                <f.Icon size={f.whatsapp ? 24 : 22} color="white" />
                {/* Anel de pulse no card WhatsApp */}
                {f.whatsapp && (
                  <span
                    className="absolute inset-0 rounded-xl animate-ping"
                    style={{ backgroundColor: '#25D366', opacity: 0.3 }}
                  />
                )}
              </div>

              <h3 className="text-lg font-semibold mb-2" style={{ color: '#0a0a0a' }}>{f.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>

              {/* Nota WhatsApp */}
              {f.whatsapp && (
                <p className="mt-4 text-xs font-medium" style={{ color: '#128C7E' }}>
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
