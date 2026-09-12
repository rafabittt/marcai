'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import SidebarLayout from '@/app/components/SidebarLayout'
import GooLoader from '@/app/components/GooLoader'
import FluxoAgendamento, { type DadosAgendamento, type Profissional } from '@/app/components/agendamento/FluxoAgendamento'
import { type Servico } from '@/app/components/agendamento/CardsServico'
import { type HorariosMap } from '@/lib/agenda'

// plano nao aparece aqui: o limite do plano e decidido no servidor, por
// /api/agendar, junto com expediente e conflito de horario.
type Negocio = { id: string; nome: string; slug: string; horarios: HorariosMap | null }

export default function AgendarInternoPage() {
  const [negocio,       setNegocio]       = useState<Negocio | null>(null)
  const [servicos,      setServicos]      = useState<Servico[]>([])
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [loading,       setLoading]       = useState(true)
  const [submitting,    setSubmitting]    = useState(false)
  const [sucesso,       setSucesso]       = useState(false)
  const [nomeCliente,   setNomeCliente]   = useState('')
  const [erro,          setErro]          = useState('')
  // Remonta o fluxo do zero a cada "Novo agendamento", zerando o estado
  // interno dele sem precisar levantar cada campo para cá.
  const [tentativa,     setTentativa]     = useState(0)

  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const { data: neg } = await supabase
        .from('negocios')
        .select('id, nome, slug, horarios')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!neg) { setLoading(false); return }
      setNegocio(neg)

      const [{ data: srvData }, { data: profData }] = await Promise.all([
        supabase.from('servicos').select('id, nome, duracao, preco').eq('negocio_id', neg.id).order('nome'),
        supabase.from('profissionais').select('id, nome, cargo').eq('negocio_id', neg.id).order('nome'),
      ])

      // Quem faz cada serviço vem da junção, igual à pública. A coluna legada
      // servicos.profissional_id não é mais lida.
      const ids = (srvData ?? []).map(s => s.id)
      const { data: vinc } = ids.length
        ? await supabase.from('servico_profissional').select('servico_id, profissional_id').in('servico_id', ids)
        : { data: [] as { servico_id: string; profissional_id: string }[] }

      setServicos((srvData ?? []).map(s => ({
        ...s,
        profissionais_ids: (vinc ?? []).filter(v => v.servico_id === s.id).map(v => v.profissional_id),
      })))
      setProfissionais(profData ?? [])
      setLoading(false)
    }
    init()
  }, [])

  // Mesma rota da pagina publica, de proposito.
  //
  // Esta tela ja fez INSERT direto no supabase do browser, pulando
  // /api/agendar — e com isso o caminho do dono ficava sem 409 de
  // double-booking, sem 422 de expediente e sem notificar o proprio dono.
  // Nada de logica de agendamento vive aqui: a tela coleta e delega.
  async function handleSubmit(d: DadosAgendamento) {
    if (!negocio) return
    setSubmitting(true)
    setErro('')

    try {
      const res = await fetch('/api/agendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: negocio.slug, ...d }),
      })

      if (res.status === 403) {
        setErro('Limite de 5 agendamentos/mês do plano Freemium atingido. Faça upgrade para continuar.')
        return
      }
      if (res.status === 422) {
        setErro('Este horário está fora da agenda configurada (expediente, pausa ou folga). Escolha outro.')
        return
      }
      if (res.status === 409) {
        setErro('Este horário já está ocupado. Escolha outro.')
        return
      }
      if (!res.ok) {
        setErro('Erro ao realizar agendamento. Tente novamente.')
        return
      }

      setNomeCliente(d.nome)
      setSucesso(true)
    } catch {
      setErro('Erro ao realizar agendamento. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64"><GooLoader /></div>
      </SidebarLayout>
    )
  }

  if (sucesso) {
    return (
      <SidebarLayout>
        <div className="py-14 px-6 flex items-start justify-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-10 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-[#dcfce7]">
              <svg className="w-8 h-8 text-[#25D366]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Agendamento confirmado!</h2>
            <p className="text-gray-500 text-sm mb-6">
              <span className="font-medium text-gray-700">{nomeCliente}</span> foi agendado com sucesso.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setSucesso(false); setTentativa(t => t + 1) }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold border-2 border-[#25D366] text-[#25D366] hover:bg-[#dcfce7] transition-colors"
              >
                Novo agendamento
              </button>
              <a
                href="/dashboard"
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-[#25D366] hover:bg-[#128C7E] text-center transition-colors"
              >
                Ver agenda
              </a>
            </div>
          </div>
        </div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout>
      <div className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Novo agendamento</h1>
            <p className="text-gray-500 mt-1 text-sm">
              {negocio?.nome} — registre um agendamento manualmente.
            </p>
          </div>

          {negocio && (
            <FluxoAgendamento
              key={tentativa}
              negocioId={negocio.id}
              horarios={negocio.horarios}
              servicos={servicos}
              profissionais={profissionais}
              rotuloNome="Nome do cliente"
              erro={erro}
              submitting={submitting}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </div>
    </SidebarLayout>
  )
}
