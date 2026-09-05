// Card de métrica com barra de progresso opcional.
// Extraído do dashboard; é a base dos tiles do "Resumo do dia".
//
// `progress` e `rodape` são opcionais porque nem toda métrica tem denominador
// ou contexto: "próximo cliente" tem rodapé e não tem barra; "hoje" tem os
// dois. `tamanhoValor` existe porque um nome de cliente não cabe no text-5xl
// que serve para um número.

export default function MetricCard({
  label, value, valueColor, iconBg, icon,
  progress, progressColor, rodape, tamanhoValor = 'text-5xl',
}: {
  label: string
  value: React.ReactNode
  valueColor: string
  iconBg: string
  icon: React.ReactNode
  progress?: number
  progressColor?: string
  rodape?: React.ReactNode
  tamanhoValor?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 pt-5 pb-4 flex flex-col relative overflow-hidden">
      <div className="flex items-start justify-between mb-3">
        <span className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">{label}</span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>

      <span className={`${tamanhoValor} font-bold tracking-tight leading-none ${valueColor}`}>
        {value}
      </span>

      {rodape && (
        <p className="text-xs text-gray-500 mt-2 truncate">{rodape}</p>
      )}

      {typeof progress === 'number' ? (
        <div className="h-1 w-full bg-gray-100 rounded-full mt-4">
          <div
            className={`h-1 rounded-full transition-all duration-500 ${progressColor ?? 'bg-gray-300'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : (
        <div className="mt-auto" />
      )}
    </div>
  )
}
