// Indicador de carregamento do Grafite: um anel fino que gira, em cinza, com a
// ponta na cor da marca. Calmo de propósito (nada de enfeite chamando atenção).
// Com "Reduzir movimento" ligado, o giro para e fica só o texto.

export default function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16" role="status" aria-live="polite">
      <span
        aria-hidden
        className="w-6 h-6 rounded-full border-2 border-fill-strong border-t-accent animate-spin motion-reduce:animate-none"
      />
      <span className="t-cap">{texto}</span>
    </div>
  )
}
