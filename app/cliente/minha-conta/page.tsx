'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Carregando from '@/app/components/Carregando'
// Etiqueta compartilhada com o painel (antes havia uma cópia aqui, sem "Faltou").
import StatusBadge from '@/app/components/StatusBadge'

type Agendamento = {
  id: string
  servico: string
  profissional: string | null
  data_hora: string
  status: string
  negocios: { nome: string }[] | { nome: string } | null
}

function negocioNome(n: Agendamento['negocios']): string {
  if (!n) return '—'
  return Array.isArray(n) ? (n[0]?.nome ?? '—') : n.nome
}

type Cliente = { nome: string; telefone: string | null }

function formatarDataHora(iso: string): string {
  const d = new Date(iso)
  const dia = d.toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', timeZone: 'UTC',
  })
  const hora = `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`
  return `${dia.charAt(0).toUpperCase() + dia.slice(1)} às ${hora}`
}

function naiveNow(): string {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}T${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}:00.000Z`
}

// Uma linha da lista (sem caixa própria: o cartão é a seção inteira).
function AgCard({ a, dim }: { a: Agendamento; dim?: boolean }) {
  return (
    <li className={`list-row !items-start ${dim ? 'opacity-60' : ''}`}>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-fg truncate">{negocioNome(a.negocios)}</p>
        <p className="text-sm text-muted mt-0.5">{a.servico}</p>
        {a.profissional && <p className="t-cap mt-0.5">com {a.profissional}</p>}
        <p className="t-cap tabular mt-1.5">{formatarDataHora(a.data_hora)}</p>
      </div>
      <StatusBadge status={a.status} passado={dim} />
    </li>
  )
}

export default function MinhaContaPage() {
  const [loading,   setLoading]   = useState(true)
  const [cliente,   setCliente]   = useState<Cliente | null>(null)
  const [proximos,  setProximos]  = useState<Agendamento[]>([])
  const [historico, setHistorico] = useState<Agendamento[]>([])

  const router   = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/cliente/login'); return }

      const [{ data: clienteData }, { data: agsData }] = await Promise.all([
        supabase.from('clientes').select('nome, telefone').eq('user_id', user.id).maybeSingle(),
        supabase
          .from('agendamentos')
          .select('id, servico, profissional, data_hora, status, negocios(nome)')
          .eq('cliente_user_id', user.id)
          .order('data_hora', { ascending: false }),
      ])

      setCliente(clienteData)

      const agora = naiveNow()
      const ags = (agsData ?? []) as unknown as Agendamento[]
      setProximos(ags.filter(a => a.data_hora >= agora && a.status !== 'cancelado').reverse())
      setHistorico(ags.filter(a => a.data_hora < agora || a.status === 'cancelado'))
      setLoading(false)
    }
    init()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/cliente/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Carregando texto="Carregando..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen">

      <header className="border-b border-hairline bg-surface">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <img src="/logo.png" alt="Marcaí" className="h-6 object-contain" />
          <button onClick={handleLogout} className="btn btn-danger max-sm:!h-11">
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-8 pb-12 space-y-[14px]">

        <div className="mb-[18px]">
          <h1 className="t-title">
            Olá, {cliente?.nome?.split(' ')[0] ?? 'Cliente'}
          </h1>
          <p className="t-sub">Seus agendamentos estão aqui.</p>
        </div>

        <section className="card !py-4">
          <h2 className="t-section mb-1">Próximos</h2>
          {proximos.length === 0 ? (
            <p className="t-cap !text-sm py-6 text-center">Nenhum agendamento próximo.</p>
          ) : (
            <ul className="list">
              {proximos.map(a => <AgCard key={a.id} a={a} />)}
            </ul>
          )}
        </section>

        {historico.length > 0 && (
          <section className="card !py-4">
            <h2 className="t-section mb-1">Histórico</h2>
            <ul className="list">
              {historico.map(a => <AgCard key={a.id} a={a} dim />)}
            </ul>
          </section>
        )}

      </main>
    </div>
  )
}
