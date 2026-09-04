// Card de métrica com barra de progresso.
// Extraído do dashboard; vira a base do "Resumo do dia" na FASE 1.

export default function MetricCard({
  label, value, valueColor, iconBg, icon, progress, progressColor,
}: {
  label: string
  value: React.ReactNode
  valueColor: string
  iconBg: string
  icon: React.ReactNode
  progress: number
  progressColor: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 pt-5 pb-4 flex flex-col relative overflow-hidden">
      <div className="flex items-start justify-between mb-3">
        <span className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">{label}</span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>
      <span className={`text-5xl font-bold tracking-tight leading-none mb-4 ${valueColor}`}>{value}</span>
      <div className="h-1 w-full bg-gray-100 rounded-full mt-auto">
        <div
          className={`h-1 rounded-full transition-all duration-500 ${progressColor}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
