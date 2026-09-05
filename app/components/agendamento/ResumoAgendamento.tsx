'use client'

import { Scissors, User, Calendar, Clock } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Resumo do agendamento, atualizado em tempo real conforme o usuário escolhe.
// Referência de padrão: Alan (linhas com ícone).
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

function Linha({ icone, label, valor }: { icone: React.ReactNode; label: string; valor: string | null }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${valor ? 'bg-[#dcfce7]' : 'bg-gray-100'}`}>
        {icone}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400">{label}</p>
        <p className={`text-sm mt-0.5 ${valor ? 'font-medium text-[#0a0a0a]' : 'text-gray-300'}`}>
          {valor ?? '—'}
        </p>
      </div>
    </div>
  )
}

export default function ResumoAgendamento({ servico, profissional, data, horario }: Props) {
  const cor = (preenchido: boolean) => preenchido ? 'text-[#128C7E]' : 'text-gray-300'
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-xs uppercase tracking-widest font-semibold text-gray-500 mb-2">
        Seu agendamento
      </h3>
      <div className="divide-y divide-gray-50">
        <Linha icone={<Scissors size={15} className={cor(!!servico)} />}      label="Serviço"      valor={servico} />
        <Linha icone={<User     size={15} className={cor(!!profissional)} />} label="Profissional" valor={profissional} />
        <Linha icone={<Calendar size={15} className={cor(!!data)} />}         label="Data"         valor={data ? formatarDataExtenso(data) : null} />
        <Linha icone={<Clock    size={15} className={cor(!!horario)} />}      label="Horário"      valor={horario || null} />
      </div>
    </div>
  )
}
