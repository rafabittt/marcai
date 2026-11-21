'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { AlertTriangle, XCircle } from 'lucide-react'
import Carregando from '@/app/components/Carregando'

const PLANO_LABELS: Record<string, { nome: string; preco: string }> = {
  basico: { nome: 'Básico',  preco: 'R$49/mês' },
  pro:    { nome: 'Pro',     preco: 'R$99/mês' },
  prime:  { nome: 'Prime',   preco: 'R$299/mês' },
}

function AssinarContent() {
  const searchParams  = useSearchParams()
  const plano         = searchParams.get('plano') ?? ''
  const [erroApi, setErro] = useState('')
  // Plano inválido é derivado do endereço, não precisa de estado.
  const planoInvalido = !plano || !PLANO_LABELS[plano]
  const erro = planoInvalido ? 'Plano inválido. Escolha um plano na página inicial.' : erroApi
  const [cpfFaltando, setCpfFaltando] = useState(false)

  useEffect(() => {
    if (planoInvalido) return

    fetch('/api/asaas/checkout', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ plano }),
    })
      .then(async r => {
        const data = await r.json()
        if (r.status === 401) { window.location.href = `/login?redirect=${encodeURIComponent(`/assinar?plano=${plano}`)}`; return }
        if (data.error === 'cpf_required') { setCpfFaltando(true); return }
        if (!r.ok || data.error) { setErro(data.error ?? 'Erro ao iniciar pagamento.'); return }
        window.location.href = data.paymentUrl
      })
      .catch(() => setErro('Erro de conexão. Tente novamente.'))
  }, [plano, planoInvalido])

  const info = PLANO_LABELS[plano]

  if (cpfFaltando) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10">
        <div className="card w-full max-w-[420px] !p-8 flex flex-col items-center text-center">
          <div className="tile-ico mb-4" aria-hidden><AlertTriangle size={18} strokeWidth={1.8} /></div>
          <h2 className="t-title mb-2">CPF obrigatório</h2>
          <p className="text-sm text-muted mb-6">
            Para assinar o plano <strong>{info?.nome}</strong>, precisamos do seu CPF.
            Preencha-o na página de perfil e volte aqui.
          </p>
          <Link
            href={`/perfil?redirect=${encodeURIComponent(`/assinar?plano=${plano}`)}`}
            className="btn btn-primary btn-lg btn-block"
          >
            Ir para Meu Perfil
          </Link>
          <Link href="/dashboard" className="btn btn-ghost btn-block mt-2">
            Cancelar
          </Link>
        </div>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10">
        <div className="card w-full max-w-[420px] !p-8 flex flex-col items-center text-center">
          <div className="tile-ico mb-4 !bg-bad-bg !text-bad-ink" aria-hidden><XCircle size={18} strokeWidth={1.8} /></div>
          <h2 className="t-title mb-2">Algo deu errado</h2>
          <p className="text-sm text-muted mb-6">{erro}</p>
          <Link
            href="/#precos"
            className="btn btn-primary btn-lg btn-block"
          >
            Ver planos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="card w-full max-w-[420px] !p-8 text-center">
        {/* O Carregando já vem com respiro próprio; aqui ele fica mais junto do título. */}
        <div className="-mt-12 -mb-6">
          <Carregando />
        </div>
        <h2 className="t-title mb-1">
          Preparando seu pagamento…
        </h2>
        {info && (
          <p className="text-sm text-muted">
            Plano <strong className="font-semibold text-fg">{info.nome}</strong> — <span className="tabular">{info.preco}</span>
          </p>
        )}
        <p className="t-cap mt-4">Você será redirecionado para o Asaas em instantes.</p>
      </div>
    </div>
  )
}

export default function AssinarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Carregando />
      </div>
    }>
      <AssinarContent />
    </Suspense>
  )
}
