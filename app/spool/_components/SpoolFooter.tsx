import Link from 'next/link'
import { EMPRESA } from './empresa'

export default function SpoolFooter() {
  return (
    <footer className="border-t border-[#EBDAC6] mt-20">
      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col md:flex-row md:justify-between gap-8">
        <div className="max-w-md">
          <div className="flex items-center gap-2 mb-3">
            <img src="/spool/simbolo.svg" alt="" width={22} height={22} />
            <img src="/spool/nome.svg" alt="Spool" style={{ height: 15, width: 'auto' }} />
          </div>
          <p className="text-sm text-[#5F5850] leading-relaxed">
            Spool é desenvolvido e mantido pela <strong className="font-semibold text-[#141414]">{EMPRESA.razao}</strong>,
            CNPJ {EMPRESA.cnpj}.
          </p>
          <p className="text-sm text-[#5F5850] leading-relaxed mt-1">{EMPRESA.endereco}</p>
        </div>
        <div className="flex gap-14 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#7A7167] mb-3">Spool</p>
            <ul className="space-y-2">
              <li><Link href="/spool" className="text-[#5F5850] hover:text-[#141414]">Início</Link></li>
              <li><Link href="/spool/privacidade" className="text-[#5F5850] hover:text-[#141414]">Política de privacidade</Link></li>
              <li><Link href="/spool/termos" className="text-[#5F5850] hover:text-[#141414]">Termos de uso</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#7A7167] mb-3">Contato</p>
            <ul className="space-y-2">
              <li><a href={`mailto:${EMPRESA.email}`} className="text-[#5F5850] hover:text-[#141414]">{EMPRESA.email}</a></li>
              <li><Link href="/" className="text-[#5F5850] hover:text-[#141414]">marcai.net.br</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-[#EBDAC6]">
        <p className="max-w-5xl mx-auto px-6 py-4 text-xs text-[#5F5850]">
          © 2026 {EMPRESA.razao} · CNPJ {EMPRESA.cnpj}
        </p>
      </div>
    </footer>
  )
}
