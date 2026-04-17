// Substituir os placeholders por depoimentos reais quando disponíveis.
// Estrutura pronta: initials/foto + nome + negócio + cidade + texto.

const stats = [
  { value: '10.000+', label: 'Agendamentos processados' },
  { value: '500+', label: 'Negócios ativos' },
  { value: '−60%', label: 'Redução média de faltas' },
]

const testimonials = [
  {
    initials: 'CM',
    name: 'Carlos Mendes',
    business: 'Barbearia do Carlos',
    city: 'São Paulo, SP',
    text: 'Antes eu perdia 2 horas por dia no telefone. Hoje o Marcaí faz tudo automaticamente. Meus clientes adoram a facilidade.',
  },
  {
    initials: 'AP',
    name: 'Ana Paula',
    business: 'Studio AP Beauty',
    city: 'Belo Horizonte, MG',
    text: 'Comecei a usar num fim de semana e já na segunda-feira tinha agendamentos chegando pelo link. Simples assim.',
  },
  {
    initials: 'RS',
    name: 'Rodrigo Silva',
    business: 'Barber RS',
    city: 'Curitiba, PR',
    text: 'Meus clientes não precisam baixar nada. É só mandar o link no WhatsApp e pronto. Reduzi muito as faltas com o lembrete automático.',
  },
]

export default function TestimonialsSection() {
  return (
    <section className="py-32 px-6 bg-white">
      <div className="max-w-5xl mx-auto">

        {/* Título */}
        <div className="mb-16">
          <p className="text-xs uppercase tracking-widest font-semibold mb-4 text-[#25D366]">
            Resultados reais
          </p>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight" style={{ color: '#0a0a0a' }}>
            Quem usa, recomenda.
          </h2>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-4 mb-16">
          {stats.map(s => (
            <div
              key={s.label}
              className="rounded-2xl p-6 text-center border border-gray-100"
              style={{ backgroundColor: '#f9f9f9' }}
            >
              <p className="text-3xl md:text-4xl font-bold mb-1" style={{ color: '#25D366' }}>
                {s.value}
              </p>
              <p className="text-xs md:text-sm text-gray-500 leading-snug">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Cards de depoimentos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(t => (
            <div
              key={t.name}
              className="bg-white rounded-2xl p-7 border border-gray-100 hover:shadow-md transition-shadow flex flex-col gap-4"
            >
              {/* Texto */}
              <p className="text-gray-600 leading-relaxed text-sm flex-1">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Autor */}
              <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: '#25D366' }}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.business} · {t.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
