'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import SidebarLayout from '@/app/components/SidebarLayout'
import GooLoader from '@/app/components/GooLoader'
import Link from 'next/link'
import { Zap, Sparkles, Check } from 'lucide-react'

type Plano = 'gratuito' | 'basico' | 'pro' | 'prime'

const PLANOS = [
  {
    key:      'gratuito' as Plano,
    nome:     'Freemium',
    preco:    'R$0',
    periodo:  '/mês',
    idealPara: 'Quem quer testar antes de assinar',
    itens: [
      '1 profissional',
      'Link de agendamento',
      'Até 5 agendamentos/mês',
      'Confirmação WhatsApp',
    ],
    destaque: false,
  },
  {
    key:      'basico' as Plano,
    nome:     'Básico',
    preco:    'R$49',
    periodo:  '/mês',
    idealPara: 'Autônomo ou 1 cadeira',
    itens: [
      '1 profissional',
      'Link de agendamento',
      'Confirmação WhatsApp',
      'Lembrete automático',
    ],
    destaque: false,
  },
  {
    key:      'pro' as Plano,
    nome:     'Pro',
    preco:    'R$99',
    periodo:  '/mês',
    idealPara: 'Salão com 2–3 profissionais',
    itens: [
      'Até 3 profissionais',
      'Tudo do Básico',
      'Relatório mensal',
      'Suporte prioritário',
    ],
    destaque: true,
  },
  {
    key:      'prime' as Plano,
    nome:     'Prime',
    preco:    'R$299',
    periodo:  '/mês',
    idealPara: 'Negócio em crescimento com equipe',
    itens: [
      'Profissionais ilimitados',
      'Tudo do Pro',
      'Onboarding dedicado',
    ],
    destaque: false,
  },
]

const PLANO_LABEL: Record<Plano, string> = {
  gratuito: 'Freemium',
  basico:   'Básico',
  pro:      'Pro',
  prime:    'Prime',
}

export default function PlanoPage() {
  const [planoAtual, setPlanoAtual] = useState<Plano | null>(null)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = '/login'; return }
      const { data } = await supabase
        .from('negocios')
        .select('plano')
        .eq('user_id', user.id)
        .maybeSingle()
      setPlanoAtual((data?.plano ?? 'gratuito') as Plano)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <GooLoader />
        </div>
      </SidebarLayout>
    )
  }

  const planoInfo = PLANOS.find(p => p.key === planoAtual)

  return (
    <SidebarLayout>
      <div className="py-14 px-6">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Plano</h1>
            <p className="text-gray-500 mt-1 text-sm">Gerencie sua assinatura e compare os planos disponíveis.</p>
          </div>

          {/* Card plano atual */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-10 flex items-center gap-5">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
              planoAtual === 'gratuito' ? 'bg-gray-100' : 'bg-[#dcfce7]'
            }`}>
              {planoAtual === 'gratuito'
                ? <Zap size={20} className="text-gray-500" />
                : <Sparkles size={20} className="text-[#128C7E]" />
              }
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-0.5">Plano atual</p>
              <p className="text-xl font-bold text-gray-900">{PLANO_LABEL[planoAtual!]}</p>
              {planoAtual === 'gratuito' && (
                <p className="text-sm text-gray-500 mt-0.5">Até 5 agendamentos por mês. Faça upgrade para crescer sem limites.</p>
              )}
              {planoAtual !== 'gratuito' && planoInfo && (
                <p className="text-sm text-gray-500 mt-0.5">{planoInfo.preco}/mês · Renova mensalmente</p>
              )}
            </div>
            {planoAtual === 'gratuito' && (
              <Link
                href="/assinar?plano=pro"
                className="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#25D366] hover:bg-[#128C7E] transition-colors"
              >
                Fazer upgrade
              </Link>
            )}
          </div>

          {/* Comparativo de planos */}
          <div className="mb-4">
            <p className="text-xs uppercase tracking-widest text-gray-400 font-medium">Todos os planos</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANOS.map(p => {
              const isAtual    = p.key === planoAtual
              const isUpgrade  = PLANOS.findIndex(x => x.key === p.key) > PLANOS.findIndex(x => x.key === planoAtual)
              const isDowngrade = !isAtual && !isUpgrade

              return (
                <div
                  key={p.key}
                  className={`rounded-2xl p-6 border text-left relative flex flex-col ${
                    isAtual
                      ? 'border-[#25D366] bg-[#f0fdf4]'
                      : p.destaque
                      ? 'border-gray-800 bg-gray-900'
                      : 'border-gray-100 bg-white'
                  }`}
                >
                  {isAtual && (
                    <span className="absolute -top-3 left-5 bg-[#25D366] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                      Plano atual
                    </span>
                  )}
                  {p.destaque && !isAtual && (
                    <span className="absolute -top-3 left-5 bg-[#25D366] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                      Mais escolhido
                    </span>
                  )}

                  <p className={`text-xs font-semibold mb-1 ${p.destaque && !isAtual ? 'text-gray-400' : 'text-gray-500'}`}>
                    {p.nome}
                  </p>
                  <div className="flex items-end gap-1 mb-1">
                    <span className={`text-3xl font-bold ${p.destaque && !isAtual ? 'text-white' : 'text-gray-900'}`}>
                      {p.preco}
                    </span>
                    <span className={`text-sm mb-1 ${p.destaque && !isAtual ? 'text-gray-400' : 'text-gray-500'}`}>
                      {p.periodo}
                    </span>
                  </div>
                  <p className={`text-xs font-medium mb-4 ${p.destaque && !isAtual ? 'text-[#25D366]' : 'text-[#128C7E]'}`}>
                    {p.idealPara}
                  </p>

                  <ul className="space-y-2 mb-5 flex-1">
                    {p.itens.map(item => (
                      <li key={item} className={`flex items-start gap-2 text-xs ${p.destaque && !isAtual ? 'text-gray-300' : 'text-gray-600'}`}>
                        <Check size={12} className="text-[#25D366] flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  {isAtual ? (
                    <div className="py-2.5 rounded-xl text-xs font-semibold text-center text-[#25D366] border border-[#25D366] bg-white">
                      Plano atual
                    </div>
                  ) : p.key === 'gratuito' || isDowngrade ? (
                    <div className="py-2.5 rounded-xl text-xs font-semibold text-center text-gray-400 border border-gray-100 bg-gray-50 cursor-not-allowed">
                      {p.key === 'gratuito' ? 'Grátis' : 'Downgrade'}
                    </div>
                  ) : (
                    <Link
                      href={`/assinar?plano=${p.key}`}
                      className={`py-2.5 rounded-xl text-xs font-semibold text-center transition-colors block ${
                        p.destaque
                          ? 'bg-[#25D366] text-white hover:bg-[#128C7E]'
                          : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Fazer upgrade
                    </Link>
                  )}
                </div>
              )
            })}
          </div>

          <p className="text-xs text-gray-400 text-center mt-6">Sem contrato. Cancele quando quiser.</p>

        </div>
      </div>
    </SidebarLayout>
  )
}
