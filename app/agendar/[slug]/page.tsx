'use client'

import React, { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import Carregando from '@/app/components/Carregando'
import FluxoAgendamento, { type DadosAgendamento, type Profissional } from '@/app/components/agendamento/FluxoAgendamento'
import { type Servico } from '@/app/components/agendamento/CardsServico'
import { type HorariosMap } from '@/lib/agenda'
import { formatarEndereco, type Endereco } from '@/lib/endereco'

// Espelha a view negocios_publico. O telefone do dono NÃO entra aqui: é dado
// privado e nunca deve trafegar para a página pública.
type Negocio = {
  id: string
  nome: string
  slug: string
  endereco: Endereco | null
  horarios: HorariosMap | null
}

export default function AgendarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params)

  const [negocio,       setNegocio]       = useState<Negocio | null>(null)
  const [servicos,      setServicos]      = useState<Servico[]>([])
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [notFound,      setNotFound]      = useState(false)
  const [loading,       setLoading]       = useState(true)
  const [submitting,    setSubmitting]    = useState(false)
  const [sucesso,       setSucesso]       = useState(false)
  const [erro,          setErro]          = useState('')
  const [horarioRecusado, setHorarioRecusado] = useState(0)

  // Nome para a tela de sucesso. Os campos do agendamento vivem dentro do
  // FluxoAgendamento.
  //
  // REGRA DO PRODUTO: o cliente agenda SEMPRE sem conta e sem login. Esta página
  // não pode ter portão de login, nem opção do negócio para exigir cadastro
  // (a opção existiu e foi removida em 20/11/2026: ver DECISOES.md item 14).
  const [nome,     setNome]     = useState('')
  // Remonta o fluxo do zero em "Fazer outro agendamento".
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch(`/api/negocio/${encodeURIComponent(slug)}`)
        if (!res.ok) { setNotFound(true); setLoading(false); return }
        const { negocio: neg, servicos: srvData, profissionais: profData } = await res.json()
        setNegocio(neg)
        setServicos(srvData)
        setProfissionais(profData)
      } catch (err) {
        console.error('[agendar] catch:', err)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [slug])

  async function enviar(d: DadosAgendamento) {
    if (!negocio) return

    setSubmitting(true)
    setErro('')

    try {
      const res = await fetch('/api/agendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: negocio.slug,
          ...d,
        }),
      })

      if (res.status === 403) {
        setErro('Este negócio atingiu o limite de agendamentos do mês. Tente novamente em breve ou entre em contato diretamente.')
        return
      }

      if (res.status === 422) {
        setErro('Este horário não está mais disponível na agenda (fora do expediente, pausa ou folga). Escolha outro.')
        setHorarioRecusado(n => n + 1)
        return
      }

      if (res.status === 409) {
        setErro('Este horário acabou de ser reservado por outra pessoa. Escolha outro horário.')
        setHorarioRecusado(n => n + 1)
        return
      }

      if (!res.ok) {
        setErro('Erro ao realizar agendamento. Tente novamente.')
        return
      }

      setNome(d.nome)
      setSucesso(true)
    } catch {
      setErro('Erro ao realizar agendamento. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-dvh grid place-items-center px-4">
        <Carregando />
      </main>
    )
  }

  if (notFound) {
    return (
      <main className="min-h-dvh grid place-items-center px-6">
        <div className="empty">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Marcaí" className="h-6 object-contain mb-4" />
          <h1 className="t-title">Negócio não encontrado</h1>
          <p className="t-sub">Verifique o link e tente novamente.</p>
        </div>
      </main>
    )
  }

  if (sucesso) {
    return (
      <main className="min-h-dvh grid place-items-center px-4 py-12">
        <div className="card w-full max-w-[440px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Marcaí" className="h-5 object-contain mx-auto mt-2" />
          <div className="empty !pt-6 !pb-2 !px-0">
            <span className="tile-ico !w-12 !h-12 !bg-accent-soft !text-accent-ink mb-3" aria-hidden>
              <Check size={24} strokeWidth={1.8} />
            </span>
            <h2 className="t-title">Agendamento confirmado!</h2>
            <p className="text-[15px] text-muted mt-1">
              Olá, <span className="font-medium text-fg">{nome}</span>!
            </p>
            <p className="text-[15px] text-muted">
              Seu agendamento em{' '}
              <span className="font-medium text-fg">{negocio?.nome}</span>{' '}
              foi registrado com sucesso.
            </p>
            <button
              onClick={() => { setSucesso(false); setTentativa(t => t + 1) }}
              className="btn btn-lg btn-block mt-6"
            >
              Fazer outro agendamento
            </button>
          </div>
        </div>
      </main>
    )
  }

  const enderecoFormatado = formatarEndereco(negocio?.endereco ?? null)

  if (!negocio) return null

  // Vitrine do dono: uma coluna estreita, pensada primeiro para o celular.
  return (
    <main className="min-h-dvh px-4 pt-8 pb-16 sm:pt-14">
      <div className="mx-auto w-full max-w-[540px]">
        <header className="mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Marcaí" className="h-6 object-contain mb-6" />
          <h1 className="t-title">{negocio.nome}</h1>
          {enderecoFormatado && (
            <p className="t-sub">{enderecoFormatado}</p>
          )}
        </header>

        <FluxoAgendamento
          horarioRecusado={horarioRecusado}
          key={tentativa}
          negocioId={negocio.id}
          horarios={negocio.horarios}
          servicos={servicos}
          profissionais={profissionais}
          nomeInicial={nome}
          erro={erro}
          submitting={submitting}
          onSubmit={enviar}
        />
      </div>
    </main>
  )
}
