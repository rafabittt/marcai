'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
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
  exigir_cadastro_cliente?: boolean
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
  const [clienteLogado, setClienteLogado] = useState(false)
  const [clienteToken,  setClienteToken]  = useState<string | null>(null)

  // Prefill do cliente logado, e nome para a tela de sucesso. Os campos do
  // agendamento em si vivem dentro do FluxoAgendamento.
  const [nome,     setNome]     = useState('')
  const [telefone, setTelefone] = useState('')
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

        if (neg.exigir_cadastro_cliente) {
          const supabase = createClient()
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            const { data: cli } = await supabase
              .from('clientes').select('nome, telefone').eq('user_id', session.user.id).maybeSingle()
            if (cli) {
              // Usuário tem conta de cliente — libera e preenche os campos
              setClienteLogado(true)
              setClienteToken(session.access_token)
              setNome(cli.nome ?? '')
              setTelefone(cli.telefone ?? '')
            }
            // Se não tem registro em clientes (ex: dono do negócio testando),
            // clienteLogado fica false e o gate aparece normalmente
          }
        }
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
          accessToken: clienteToken ?? undefined,
        }),
      })

      if (res.status === 403) {
        setErro('Este negócio atingiu o limite de agendamentos do mês. Tente novamente em breve ou entre em contato diretamente.')
        return
      }

      if (res.status === 422) {
        setErro('Este horário não está mais disponível na agenda (fora do expediente, pausa ou folga). Escolha outro.')
        return
      }

      if (res.status === 409) {
        setErro('Este horário acabou de ser reservado por outra pessoa. Escolha outro horário.')
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Carregando...</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="text-center">
          <p className="text-[#25D366] font-bold text-lg mb-4">Marcaí</p>
          <p className="text-xl font-bold text-gray-900 mb-2">Negócio não encontrado</p>
          <p className="text-gray-500 text-sm">Verifique o link e tente novamente.</p>
        </div>
      </div>
    )
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-10 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-[#dcfce7]">
            <svg className="w-8 h-8 text-[#25D366]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-2">Marcaí</p>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Agendamento confirmado!</h2>
          <p className="text-gray-500 text-sm mb-1">
            Olá, <span className="font-medium text-gray-600">{nome}</span>!
          </p>
          <p className="text-gray-500 text-sm">
            Seu agendamento em{' '}
            <span className="font-medium text-gray-600">{negocio?.nome}</span>{' '}
            foi registrado com sucesso.
          </p>
          <button
            onClick={() => { setSucesso(false); setTentativa(t => t + 1) }}
            className="mt-8 w-full py-3 rounded-xl text-sm font-semibold border-2 border-[#25D366] text-[#25D366] transition-all duration-200 hover:bg-[#dcfce7] hover:scale-[1.02]"
          >
            Fazer outro agendamento
          </button>
        </div>
      </div>
    )
  }

  const enderecoFormatado = formatarEndereco(negocio?.endereco ?? null)
  const slugEncoded = encodeURIComponent(`/agendar/${negocio?.slug ?? slug}`)

  if (negocio?.exigir_cadastro_cliente && !clienteLogado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Marcaí" className="h-7 object-contain mx-auto mb-6" />
          <h1 className="text-xl font-bold text-gray-900 mb-1">{negocio.nome}</h1>
          <p className="text-sm text-gray-500 mb-8">
            Para agendar, crie uma conta ou faça login. É rápido e gratuito.
          </p>
          <div className="flex flex-col gap-3">
            <a
              href={`/cliente/cadastro?redirect=${slugEncoded}`}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-[#25D366] transition-all duration-200 hover:bg-[#128C7E] text-center"
            >
              Criar conta
            </a>
            <a
              href={`/cliente/login?redirect=${slugEncoded}`}
              className="w-full py-3 rounded-xl text-sm font-semibold border-2 border-gray-200 text-gray-700 transition-all duration-200 hover:bg-gray-50 text-center"
            >
              Já tenho conta
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (!negocio) return null

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 sm:py-14">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Marcaí" className="h-7 object-contain mb-5" />
          <h1 className="text-3xl font-bold text-gray-900 leading-tight tracking-tight">
            {negocio.nome}
          </h1>
          {enderecoFormatado && (
            <p className="text-sm text-gray-500 mt-1.5">{enderecoFormatado}</p>
          )}
        </div>

        <FluxoAgendamento
          key={tentativa}
          negocioId={negocio.id}
          horarios={negocio.horarios}
          servicos={servicos}
          profissionais={profissionais}
          nomeInicial={nome}
          telefoneInicial={telefone}
          erro={erro}
          submitting={submitting}
          onSubmit={enviar}
        />
      </div>
    </div>
  )
}
