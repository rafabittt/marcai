'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { AlertTriangle, XCircle } from 'lucide-react'
import GooLoader from '@/app/components/GooLoader'

const PLANO_LABELS: Record<string, { nome: string; preco: string }> = {
  basico: { nome: 'Básico',  preco: 'R$49/mês' },
  pro:    { nome: 'Pro',     preco: 'R$99/mês' },
  prime:  { nome: 'Prime',   preco: 'R$299/mês' },
}

function AssinarContent() {
  const searchParams  = useSearchParams()
  const plano         = searchParams.get('plano') ?? ''
  const [erro, setErro] = useState('')
  const [cpfFaltando, setCpfFaltando] = useState(false)

  useEffect(() => {
    if (!plano || !PLANO_LABELS[plano]) {
      setErro('Plano inválido. Escolha um plano na página inicial.')
      return
    }

    fetch('/api/asaas/checkout', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ plano }),
    })
      .then(async r => {
        const data = await r.json()
        if (r.status === 401) { window.location.href = `/login?redirect=/assinar?plano=${plano}`; return }
        if (data.error === 'cpf_required') { setCpfFaltando(true); return }
        if (!r.ok || data.error) { setErro(data.error ?? 'Erro ao iniciar pagamento.'); return }
        window.location.href = data.paymentUrl
      })
      .catch(() => setErro('Erro de conexão. Tente novamente.'))
  }, [plano])

  const info = PLANO_LABELS[plano]

  if (cpfFaltando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-10 text-center">
          <div className="flex justify-center mb-4"><AlertTriangle size={36} className="text-yellow-500" /></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">CPF obrigatório</h2>
          <p className="text-gray-500 text-sm mb-6">
            Para assinar o plano <strong>{info?.nome}</strong>, precisamos do seu CPF.
            Preencha-o na página de perfil e volte aqui.
          </p>
          <Link
            href={`/perfil?redirect=/assinar?plano=${plano}`}
            className="block w-full py-3 rounded-xl text-sm font-semibold text-white bg-[#25D366] hover:bg-[#128C7E] transition-colors text-center"
          >
            Ir para Meu Perfil
          </Link>
          <Link href="/dashboard" className="block mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Cancelar
          </Link>
        </div>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-10 text-center">
          <div className="flex justify-center mb-4"><XCircle size={36} className="text-red-400" /></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Algo deu errado</h2>
          <p className="text-gray-500 text-sm mb-6">{erro}</p>
          <Link
            href="/#precos"
            className="block w-full py-3 rounded-xl text-sm font-semibold text-white bg-[#25D366] hover:bg-[#128C7E] transition-colors text-center"
          >
            Ver planos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-10 text-center">
        <div className="flex justify-center mb-6">
          <GooLoader />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Preparando seu pagamento…
        </h2>
        {info && (
          <p className="text-gray-500 text-sm">
            Plano <strong>{info.nome}</strong> — {info.preco}
          </p>
        )}
        <p className="text-gray-400 text-xs mt-4">Você será redirecionado para o Asaas em instantes.</p>
      </div>
    </div>
  )
}

export default function AssinarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <GooLoader />
      </div>
    }>
      <AssinarContent />
    </Suspense>
  )
}
