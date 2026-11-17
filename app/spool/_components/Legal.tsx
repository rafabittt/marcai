import { POPPINS } from './empresa'

// Moldura das páginas legais do Spool: título, data e um cartão branco com as seções.
export function LegalPage({ titulo, atualizado, children }: { titulo: string; atualizado: string; children: React.ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto px-6 pt-14 sm:pt-20">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#A34700] mb-3">Spool · Legal</p>
      <h1 className="text-4xl font-bold tracking-tight" style={POPPINS}>{titulo}</h1>
      <p className="text-sm text-[#5F5850] mt-2">Última atualização: {atualizado}</p>
      <div className="mt-10 rounded-2xl border border-[#EBDAC6] bg-white p-7 sm:p-10 space-y-9 text-[15px] leading-relaxed text-[#3D3833]">
        {children}
      </div>
    </div>
  )
}

export function Secao({ titulo, id, children }: { titulo: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-xl font-bold text-[#141414] mb-3" style={POPPINS}>{titulo}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

export function Lista({ itens }: { itens: React.ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {itens.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="mt-[9px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#FF7A00]" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
