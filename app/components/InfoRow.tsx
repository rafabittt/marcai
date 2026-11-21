// Linha rótulo/valor usada nos detalhes de agendamento (painel lateral).
// Lista do Grafite: separador fino entre as linhas, sem caixa por linha.

export default function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center gap-4 py-3 border-b border-hairline last:border-0">
      <span className="t-label">{label}</span>
      <span className="text-[15px] font-medium text-fg text-right">{value}</span>
    </div>
  )
}
