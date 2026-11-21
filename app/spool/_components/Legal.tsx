// Moldura das páginas legais do Spool: título, data e um cartão com as seções (separadas por espaço, sem caixas por dentro).
export function LegalPage({ titulo, atualizado, children }: { titulo: string; atualizado: string; children: React.ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto px-6 pt-14 sm:pt-20">
      <p className="t-caps mb-3">Spool · Legal</p>
      <h1 className="t-title sm:text-[32px]">{titulo}</h1>
      <p className="text-sm text-muted mt-2">Última atualização: {atualizado}</p>
      <div className="card mt-8 sm:p-10 space-y-9 text-[15px] leading-relaxed text-fg">
        {children}
      </div>
    </div>
  )
}

export function Secao({ titulo, id, children }: { titulo: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="t-section text-[17px] mb-3">{titulo}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

export function Lista({ itens }: { itens: React.ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {itens.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="mt-[9px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-faint" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
