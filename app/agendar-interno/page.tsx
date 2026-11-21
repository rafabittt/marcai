'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import SidebarLayout from '@/app/components/SidebarLayout'
import Carregando from '@/app/components/Carregando'
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
        <div className="flex items-center justify-center h-64"><Carregando /></div>
      </SidebarLayout>
    )
  }

  if (sucesso) {
    return (
      <SidebarLayout>
        <main className="page page-narrow">
          <div className="card max-w-[480px] mx-auto">
            <div className="empty !py-6">
              <span className="tile-ico !w-12 !h-12 !bg-accent-soft !text-accent-ink mb-3" aria-hidden>
                <Check size={24} strokeWidth={1.8} />
              </span>
              <h2 className="t-title">Agendamento confirmado!</h2>
              <p className="text-[15px] text-muted mt-1">
                <span className="font-medium text-fg">{nomeCliente}</span> foi agendado com sucesso.
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 w-full mt-6">
                <button
                  onClick={() => { setSucesso(false); setTentativa(t => t + 1) }}
                  className="btn btn-lg flex-1"
                >
                  Novo agendamento
                </button>
                <a href="/dashboard" className="btn btn-primary btn-lg flex-1">
                  Ver agenda
                </a>
              </div>
            </div>
          </div>
        </main>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout>
      <main className="page page-narrow">
        <div className="page-head">
          <div className="min-w-0">
            <h1 className="t-title">Novo agendamento</h1>
            <p className="t-sub">
              {negocio?.nome} — registre um agendamento manualmente.
            </p>
          </div>
        </div>

        {negocio && (
          <div className="max-w-[560px]">
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
          </div>
        )}
      </main>
    </SidebarLayout>
  )
}
