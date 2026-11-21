import Link from 'next/link'
import { EMPRESA } from './empresa'

export default function SpoolFooter() {
  return (
    <footer className="border-t border-hairline mt-20">
      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col md:flex-row md:justify-between gap-8">
        <div className="max-w-md">
          <div className="flex items-center gap-2 mb-3">
            <img src="/spool/simbolo.svg" alt="" width={22} height={22} />
            {/* o nome é desenhado em preto; no escuro invertemos para ficar claro */}
            <img src="/spool/nome.svg" alt="Spool" className="dark:invert" style={{ height: 15, width: 'auto' }} />
          </div>
          <p className="text-sm text-muted leading-relaxed">
            Spool é desenvolvido e mantido pela <strong className="font-semibold text-fg">{EMPRESA.razao}</strong>,
            CNPJ {EMPRESA.cnpj}.
          </p>
          <p className="text-sm text-muted leading-relaxed mt-1">{EMPRESA.endereco}</p>
        </div>
        <div className="flex gap-14 text-sm">
          <div>
            <p className="t-caps mb-3">Spool</p>
            <ul className="space-y-2">
              <li><Link href="/spool" className="text-muted hover:text-fg">Início</Link></li>
              <li><Link href="/spool/privacidade" className="text-muted hover:text-fg">Política de privacidade</Link></li>
              <li><Link href="/spool/termos" className="text-muted hover:text-fg">Termos de uso</Link></li>
            </ul>
          </div>
          <div>
            <p className="t-caps mb-3">Contato</p>
            <ul className="space-y-2">
              <li><a href={`mailto:${EMPRESA.email}`} className="text-muted hover:text-fg">{EMPRESA.email}</a></li>
              <li><Link href="/" className="text-muted hover:text-fg">marcai.net.br</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-hairline">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:justify-between gap-1">
          <p className="t-cap">
            © 2026 {EMPRESA.razao} · CNPJ {EMPRESA.cnpj}
          </p>
          {/* assinatura do Grafite, a mesma da barra lateral do app Spool */}
          <p className="t-cap">
            Spool · um app da <b className="font-semibold text-fg">Marcaí</b>
          </p>
        </div>
      </div>
    </footer>
  )
}
