// Linha rótulo/valor usada nos detalhes de agendamento.
// Extraído do dashboard; reaproveitado no painel lateral e na mini-ficha
// do cliente na FASE 1.

export default function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs uppercase tracking-widest font-medium text-gray-500">{label}</span>
      <span className="text-sm font-medium" style={{ color: '#0a0a0a' }}>{value}</span>
    </div>
  )
}
