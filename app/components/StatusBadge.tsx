// Pílula de status do agendamento — fonte única de cores e rótulos.
// Extraído do dashboard para ser reaproveitado pela agenda visual (FASE 1)
// e pelo painel lateral.
//
// Nota: 'concluido' NÃO é um status gravado no banco. Ele é derivado de
// (agendamento no passado + status 'confirmado') via a prop `passado`.
// 'no_show' e 'bloqueado' precisam existir no banco para serem usados.

export type StatusAgendamento =
  | 'confirmado' | 'pendente' | 'cancelado' | 'concluido' | 'no_show' | 'bloqueado'

type Estilo = { label: string; classes: string; cor: string }

export const STATUS_ESTILOS: Record<string, Estilo> = {
  confirmado: { label: 'Confirmado', classes: 'bg-[#dcfce7] text-[#128C7E]', cor: '#25D366' },
  pendente:   { label: 'Pendente',   classes: 'bg-yellow-50 text-yellow-600', cor: '#f59e0b' },
  cancelado:  { label: 'Cancelado',  classes: 'bg-red-50 text-red-500',       cor: '#f87171' },
  concluido:  { label: 'Realizado',  classes: 'bg-gray-100 text-gray-500',    cor: '#9ca3af' },
  no_show:    { label: 'Faltou',     classes: 'bg-red-50 text-[#ef4444]',     cor: '#ef4444' },
  bloqueado:  { label: 'Bloqueado',  classes: 'bg-gray-100 text-gray-600',    cor: '#6b7280' },
}

const FALLBACK: Estilo = { label: '—', classes: 'bg-gray-100 text-gray-500', cor: '#9ca3af' }

/** Resolve o status exibido, aplicando a derivação de 'concluido'. */
export function resolverStatus(status: string, passado = false): string {
  return passado && status === 'confirmado' ? 'concluido' : status
}

export function corDoStatus(status: string, passado = false): string {
  return (STATUS_ESTILOS[resolverStatus(status, passado)] ?? FALLBACK).cor
}

export default function StatusBadge({
  status, passado = false,
}: {
  status: string
  passado?: boolean
}) {
  const s = STATUS_ESTILOS[resolverStatus(status, passado)] ?? { ...FALLBACK, label: status }
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.classes}`}>
      {s.label}
    </span>
  )
}
