// Cartão de número do Grafite: rótulo com ícone em cima, número grande,
// legenda embaixo e, se fizer sentido, uma barrinha de progresso.
// Só o cartão principal da tela leva a mancha verde (`destaque`).
//
// `progress` e `rodape` são opcionais porque nem toda métrica tem denominador
// ou contexto: "próximo cliente" tem rodapé e não tem barra; "horários vagos"
// tem os dois.

export default function MetricCard({
  label, value, icon, unidade, progress, rodape, destaque = false, apagado = false, className = '',
}: {
  label: string
  value: React.ReactNode
  icon: React.ReactNode
  /** Texto pequeno e cinza ao lado do número ("de 12"). */
  unidade?: React.ReactNode
  progress?: number
  rodape?: React.ReactNode
  /** Cartão principal da tela: leva a mancha da cor. Um por tela. */
  destaque?: boolean
  /** Sem valor (ex.: "—"): número em cinza. */
  apagado?: boolean
  className?: string
}) {
  return (
    <div className={`card flex flex-col min-w-0 ${destaque ? 'card-hero' : ''} ${className}`}>
      <p className="t-label flex items-center gap-2 mb-3">
        <span className="text-faint [&>svg]:block" aria-hidden>{icon}</span>
        {label}
      </p>

      <p className={`t-num tabular ${apagado ? '!text-faint' : ''}`}>
        {value}
        {unidade && <small> {unidade}</small>}
      </p>

      {rodape && <p className="t-cap mt-1.5 truncate">{rodape}</p>}

      {typeof progress === 'number' && (
        <div className="h-1.5 w-full rounded-full bg-fill mt-4 overflow-hidden" role="presentation">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500 ease-grafite"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      )}
    </div>
  )
}
