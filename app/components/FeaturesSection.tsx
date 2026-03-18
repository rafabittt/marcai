'use client'

import { useEffect, useRef, useState } from 'react'
import { Link2, MessageCircle, LayoutDashboard } from 'lucide-react'

const features = [
  {
    Icon: Link2,
    title: 'Seu link único',
    desc: 'Compartilhe um link e seus clientes agendam na hora, sem ligação, sem confusão.',
  },
  {
    Icon: MessageCircle,
    title: 'Confirmação automática',
    desc: 'Cada agendamento gera uma mensagem automática no WhatsApp do cliente e do seu negócio.',
  },
  {
    Icon: LayoutDashboard,
    title: 'Dashboard em tempo real',
    desc: 'Veja todos os agendamentos do dia num painel simples e organizado.',
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
              className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(40px)',
                transition: `opacity 0.55s ease ${i * 0.15}s, transform 0.55s ease ${i * 0.15}s`,
              }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-[#25D366]">
                <f.Icon size={22} color="white" />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#0a0a0a' }}>{f.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
