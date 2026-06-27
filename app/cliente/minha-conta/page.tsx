'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    confirmado: { label: 'Confirmado', cls: 'bg-[#dcfce7] text-[#128C7E]' },
    cancelado:  { label: 'Cancelado',  cls: 'bg-red-50 text-red-500' },
    realizado:  { label: 'Realizado',  cls: 'bg-gray-100 text-gray-500' },
  }
  const s = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-500' }
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${s.cls}`}>{s.label}</span>
}

function AgCard({ a, dim }: { a: Agendamento; dim?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 p-5 ${dim ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{negocioNome(a.negocios)}</p>
          <p className="text-sm text-gray-600 mt-0.5">{a.servico}</p>
          {a.profissional && <p className="text-xs text-gray-400 mt-0.5">com {a.profissional}</p>}
          <p className="text-xs text-gray-400 mt-2">{formatarDataHora(a.data_hora)}</p>
        </div>
        <StatusBadge status={a.status} />
      </div>
    </div>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <img src="/logo.png" alt="Marcaí" className="h-6 object-contain" />
          <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
            Sair
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Olá, {cliente?.nome?.split(' ')[0] ?? 'Cliente'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Seus agendamentos estão aqui.</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-widest font-semibold text-gray-400 mb-3">Próximos</p>
          {proximos.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <p className="text-sm text-gray-400">Nenhum agendamento próximo.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {proximos.map(a => <AgCard key={a.id} a={a} />)}
            </div>
          )}
        </div>

        {historico.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold text-gray-400 mb-3">Histórico</p>
            <div className="space-y-3">
              {historico.map(a => <AgCard key={a.id} a={a} dim />)}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
