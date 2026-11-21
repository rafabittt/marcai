// Etiqueta de status do agendamento — fonte única de cores e rótulos.
// Reaproveitada pelo painel, pela agenda e pelo painel lateral.
//
// Grafite: a cor viva (verde) só no que está de pé; erro em vermelho do
// sistema; o resto em cinza. O estado nunca é só cor: a etiqueta sempre tem
// o texto.
//
// Nota: 'concluido' NÃO é um status gravado no banco. Ele é derivado de
// (agendamento no passado + status 'confirmado') via a prop `passado`.
// 'no_show' e 'bloqueado' precisam existir no banco para serem usados.

export type StatusAgendamento =
  | 'confirmado' | 'pendente' | 'cancelado' | 'concluido' | 'no_show' | 'bloqueado'

type Estilo = { label: string; classes: string; cor: string }

// `cor` é usada em gráficos e bolinhas (CSS, aceita variável).
export const STATUS_ESTILOS: Record<string, Estilo> = {
  confirmado: { label: 'Confirmado', classes: 'badge-accent', cor: 'var(--accent)' },
  pendente:   { label: 'Pendente',   classes: '',             cor: 'var(--faint)' },
  cancelado:  { label: 'Cancelado',  classes: '',             cor: 'var(--faint)' },
  concluido:  { label: 'Realizado',  classes: '',             cor: 'var(--muted)' },
  no_show:    { label: 'Faltou',     classes: 'badge-bad',    cor: 'var(--bad)' },
  bloqueado:  { label: 'Bloqueado',  classes: '',             cor: 'var(--muted)' },
}

const FALLBACK: Estilo = { label: '—', classes: '', cor: 'var(--faint)' }

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
    <span className={`badge ${s.classes}`}>
      <span className="badge-dot" aria-hidden />
      {s.label}
    </span>
  )
}
