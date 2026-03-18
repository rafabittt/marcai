'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Negocio = {
  id: string
  nome: string
  slug: string
}

export default function AgendarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params)
  const [negocio, setNegocio] = useState<Negocio | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')

  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [servico, setServico] = useState('')
  const [data, setData] = useState('')
  const [horario, setHorario] = useState('')

  const supabase = createClient()

  useEffect(() => {
    async function buscarNegocio() {
      const { data, error } = await supabase
        .from('negocios')
        .select('id, nome, slug')
        .eq('slug', slug)
        .single()

      if (error || !data) {
        setNotFound(true)
      } else {
        setNegocio(data)
      }
      setLoading(false)
    }

    buscarNegocio()
  }, [slug])

  async function enviarWhatsApp(tel: string, mensagem: string) {
    try {
      await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: tel, mensagem }),
      })
    } catch (err) {
      console.error('Falha ao enviar WhatsApp:', err)
    }
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!negocio) return

    setSubmitting(true)
    setErro('')

    const data_hora = new Date(`${data}T${horario}`).toISOString()
    const dataFormatada = new Date(data_hora).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const horaFormatada = horario

    const { error } = await supabase.from('agendamentos').insert({
      negocio_id: negocio.id,
      cliente_nome: nome,
      cliente_telefone: telefone,
      servico,
      data_hora,
      status: 'confirmado',
    })

    if (error) {
      setErro('Erro ao realizar agendamento. Tente novamente.')
      setSubmitting(false)
      return
    }

    setSucesso(true)
    setSubmitting(false)

    // Dispara mensagens em background — falhas não bloqueiam o sucesso
    const msgCliente = `Olá ${nome}! Seu agendamento em ${negocio.nome} foi confirmado para ${dataFormatada} às ${horaFormatada}. Até lá! 🗓️`
    enviarWhatsApp(telefone, msgCliente)

    // Busca telefone do negócio para notificar o dono
    const { data: negocioCompleto } = await supabase
      .from('negocios')
      .select('telefone')
      .eq('id', negocio.id)
      .single()

    if (negocioCompleto?.telefone) {
      const msgDono = `Novo agendamento! ${nome} agendou ${servico} para ${dataFormatada} às ${horaFormatada}. Telefone: ${telefone}`
      enviarWhatsApp(negocioCompleto.telefone, msgDono)
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
            onClick={() => {
              setSucesso(false)
              setNome('')
              setTelefone('')
              setServico('')
              setData('')
              setHorario('')
            }}
            className="mt-8 w-full py-3 rounded-xl text-sm font-semibold border-2 border-[#25D366] text-[#25D366] transition-all duration-200 hover:bg-[#dcfce7] hover:scale-[1.02]"
          >
            Fazer outro agendamento
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8">

        {/* Cabeçalho do card */}
        <div className="mb-8">
          <p className="text-xs font-bold tracking-widest uppercase mb-4 text-[#25D366]">
            Marcaí
          </p>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{negocio?.nome}</h1>
          <p className="text-gray-500 text-sm mt-1">Preencha os dados para agendar</p>
        </div>

        {erro && (
          <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl mb-6">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-1.5 block">
              Seu nome
            </label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
              placeholder="João Silva"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#25D366] placeholder-gray-300"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-1.5 block">
              Telefone / WhatsApp
            </label>
            <input
              type="tel"
              value={telefone}
              onChange={e => setTelefone(e.target.value)}
              required
              placeholder="(11) 99999-9999"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#25D366] placeholder-gray-300"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-1.5 block">
              Serviço desejado
            </label>
            <input
              type="text"
              value={servico}
              onChange={e => setServico(e.target.value)}
              required
              placeholder="Ex: Corte de cabelo"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#25D366] placeholder-gray-300"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-1.5 block">
                Data
              </label>
              <input
                type="date"
                value={data}
                onChange={e => setData(e.target.value)}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#25D366]"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-1.5 block">
                Horário
              </label>
              <input
                type="time"
                value={horario}
                onChange={e => setHorario(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#25D366]"
              />
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-[#25D366] transition-all duration-200 hover:bg-[#128C7E] hover:scale-[1.02] disabled:opacity-50"
            >
              {submitting ? 'Agendando...' : 'Confirmar agendamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
