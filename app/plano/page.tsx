'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import SidebarLayout from '@/app/components/SidebarLayout'
import Carregando from '@/app/components/Carregando'
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
        <Carregando />
      </SidebarLayout>
    )
  }

  const planoInfo = PLANOS.find(p => p.key === planoAtual)

  return (
    <SidebarLayout>
      <main className="page">

        <div className="page-head">
          <div>
            <h1 className="t-title">Plano</h1>
            <p className="t-sub">Gerencie sua assinatura e compare os planos disponíveis.</p>
          </div>
        </div>

        {/* Plano atual: o cartão principal da tela (o único com a mancha verde). */}
        <section className="card card-hero mb-[28px]">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="tile-ico !w-11 !h-11" aria-hidden>
                {planoAtual === 'gratuito'
                  ? <Zap size={20} strokeWidth={1.8} />
                  : <Sparkles size={20} strokeWidth={1.8} />
                }
              </div>
              <div className="min-w-0">
                <p className="t-label">Plano atual</p>
                <p className="text-[22px] font-semibold tracking-[-0.02em] leading-tight text-fg mt-0.5">
                  {PLANO_LABEL[planoAtual!]}
                </p>
                {planoAtual === 'gratuito' && (
                  <p className="t-cap mt-1">Até 5 agendamentos por mês. Faça upgrade para crescer sem limites.</p>
                )}
                {planoAtual !== 'gratuito' && planoInfo && (
                  <p className="t-cap mt-1 tabular">{planoInfo.preco}/mês · Renova mensalmente</p>
                )}
              </div>
            </div>
            {planoAtual === 'gratuito' && (
              <Link href="/assinar?plano=pro" className="btn btn-primary self-start sm:self-auto">
                Fazer upgrade
              </Link>
            )}
          </div>
        </section>

        {/* Comparativo de planos */}
        <h2 className="t-section mb-3">Todos os planos</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-[14px]">
          {PLANOS.map(p => {
            const isAtual    = p.key === planoAtual
            const isUpgrade  = PLANOS.findIndex(x => x.key === p.key) > PLANOS.findIndex(x => x.key === planoAtual)
            const isDowngrade = !isAtual && !isUpgrade

            return (
              <div
                key={p.key}
                className="card card-sm flex flex-col"
              >
                <div className="flex items-center justify-between gap-2 mb-2 min-h-[22px]">
                  <p className="t-label">{p.nome}</p>
                  {isAtual && <span className="badge badge-accent">Seu plano</span>}
                  {p.destaque && !isAtual && <span className="badge">Mais escolhido</span>}
                </div>

                <p className="t-num">
                  {p.preco}<small>{p.periodo}</small>
                </p>
                <p className="t-cap mt-1.5 mb-4">{p.idealPara}</p>

                <ul className="space-y-2 mb-5 flex-1 border-t border-hairline pt-4">
                  {p.itens.map(item => (
                    <li key={item} className="flex items-start gap-2 text-[13px] text-fg">
                      <Check size={14} strokeWidth={1.8} className="text-muted flex-none mt-0.5" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>

                {isAtual ? (
                  <span className="btn btn-sm btn-block" aria-disabled="true">
                    Plano atual
                  </span>
                ) : p.key === 'gratuito' || isDowngrade ? (
                  <span className="btn btn-sm btn-block" aria-disabled="true">
                    {p.key === 'gratuito' ? 'Grátis' : 'Downgrade'}
                  </span>
                ) : (
                  <Link href={`/assinar?plano=${p.key}`} className="btn btn-sm btn-block">
                    Fazer upgrade
                  </Link>
                )}
              </div>
            )
          })}
        </div>

        <p className="t-cap text-center mt-6">Sem contrato. Cancele quando quiser.</p>

      </main>
    </SidebarLayout>
  )
}
