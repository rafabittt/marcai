'use client'

import InfoRow from '@/app/components/InfoRow'

// ─────────────────────────────────────────────────────────────────────────────
// Resumo do agendamento, atualizado em tempo real conforme o usuário escolhe.
// Linhas rótulo/valor do Grafite (InfoRow), separador fino, sem caixa por linha.
//
// A data chega como 'YYYY-MM-DD'. Ela é formatada montando o Date a partir das
// PARTES (ano, mês, dia), nunca via new Date(string) — parsear a string ISO
// jogaria a data para UTC e poderia exibir o dia anterior.
// ─────────────────────────────────────────────────────────────────────────────

export function formatarDataExtenso(dataStr: string): string {
  const [ano, mes, dia] = dataStr.split('-').map(Number)
  return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  })
}

type Props = {
  servico: string | null
  profissional: string | null
  data: string
  horario: string
}

// O que ainda não foi escolhido aparece como um traço apagado.
function valorOuTraco(valor: string | null, extra = '') {
  return valor
    ? <span className={extra}>{valor}</span>
    : <span className="text-faint font-normal">—</span>
}

export default function ResumoAgendamento({ servico, profissional, data, horario }: Props) {
  return (
    <section className="card" aria-label="Seu agendamento">
      <h3 className="t-section mb-1">Seu agendamento</h3>
      <div>
        <InfoRow label="Serviço"      value={valorOuTraco(servico)} />
        <InfoRow label="Profissional" value={valorOuTraco(profissional)} />
        <InfoRow label="Data"         value={valorOuTraco(data ? formatarDataExtenso(data) : null, 'first-letter:uppercase inline-block')} />
        <InfoRow label="Horário"      value={valorOuTraco(horario || null, 'tabular')} />
      </div>
    </section>
  )
}
