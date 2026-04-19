'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    q: 'Meu cliente precisa baixar algum app?',
    a: 'Não. Basta abrir o link que você envia. Funciona direto no navegador do celular — sem app, sem cadastro, sem senha.',
  },
  {
    q: 'Como funciona a confirmação pelo WhatsApp?',
    a: 'Automaticamente, assim que seu cliente agenda. Tanto você quanto ele recebem uma mensagem de confirmação no WhatsApp na hora — sem nenhuma ação manual da sua parte.',
  },
  {
    q: 'Funciona com qualquer número de WhatsApp?',
    a: 'Sim, funciona com WhatsApp pessoal ou WhatsApp Business. Não é necessário nenhum número especial nem conta paga do WhatsApp.',
  },
  {
    q: 'Posso cancelar quando quiser?',
    a: 'Pode. Sem multa, sem burocracia. Você cancela na própria plataforma a qualquer momento — é tudo no seu controle.',
  },
  {
    q: 'Quanto tempo leva para configurar?',
    a: 'Menos de 5 minutos. Crie sua conta, defina seus serviços e copie o link — pronto para compartilhar com seus clientes hoje mesmo.',
  },
]

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="pt-16 pb-32 px-6 bg-white">
      <div className="max-w-3xl mx-auto">

        <div className="mb-16">
          <p className="text-xs uppercase tracking-widest font-semibold mb-4 text-[#25D366]">
            Dúvidas frequentes
          </p>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight" style={{ color: '#0a0a0a' }}>
            Respostas rápidas.
          </h2>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, i) => {
            const isOpen = open === i
            return (
              <div
                key={i}
                className="border border-gray-100 rounded-2xl overflow-hidden"
                style={{
                  boxShadow: isOpen ? '0 2px 12px rgba(37,211,102,0.08)' : undefined,
                  borderColor: isOpen ? '#25D366' : undefined,
                  transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
                }}
              >
                <button
                  className="w-full flex items-center justify-between text-left px-6 py-5 gap-4 hover:bg-gray-50 transition-colors"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span className="text-base font-semibold text-gray-900">{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className="flex-shrink-0 text-gray-400"
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease',
                      color: isOpen ? '#25D366' : undefined,
                    }}
                  />
                </button>
                <div
                  style={{
                    maxHeight: isOpen ? '200px' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 0.35s ease',
                  }}
                >
                  <p className="px-6 pb-5 text-gray-500 leading-relaxed">{faq.a}</p>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
