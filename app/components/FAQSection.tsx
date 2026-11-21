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

// Perguntas num cartão só, com linhas separadas por borda fina (uma caixa por
// nível). Abrir/fechar: a resposta aparece com fade curto; a seta gira.
export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="scroll-mt-20 pt-16 pb-12 md:pb-16 px-6">
      <div className="max-w-3xl mx-auto">

        <div className="mb-10 md:mb-14">
          <p className="t-caps mb-4">
            Dúvidas frequentes
          </p>
          <h2 className="text-[32px] md:text-[44px] font-semibold leading-[1.1] tracking-[-0.03em] text-fg">
            Respostas rápidas.
          </h2>
        </div>

        <div className="card !py-1 !px-5 sm:!px-6">
          {faqs.map((faq, i) => {
            const isOpen = open === i
            return (
              <div key={i} className="border-t border-hairline first:border-t-0">
                <button
                  className="group w-full min-h-[44px] flex items-center justify-between text-left py-5 gap-4"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span className="text-base font-semibold text-fg">{faq.q}</span>
                  <ChevronDown
                    size={18}
                    strokeWidth={1.8}
                    aria-hidden
                    className={`flex-shrink-0 text-faint group-hover:text-fg transition-transform duration-200 ease-grafite ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <div
                  style={{
                    maxHeight: isOpen ? '200px' : '0',
                    overflow: 'hidden',
                    opacity: isOpen ? 1 : 0,
                    transition: 'opacity 200ms var(--ease-out)',
                  }}
                >
                  <p className="pb-5 pr-8 text-muted leading-relaxed">{faq.a}</p>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
