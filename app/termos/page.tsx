import LandingHeader from '../components/LandingHeader'

export default function TermosPage() {
  return (
    <div className="min-h-screen" style={{ background: '#f9f9f9' }}>
      <LandingHeader />
      <div className="py-14 px-6">
      <div className="max-w-3xl mx-auto">

        <div className="mb-10">
          <p className="text-xs uppercase tracking-widest font-semibold text-[#25D366] mb-3">Legal</p>
          <h1 className="text-4xl font-bold tracking-tight" style={{ color: '#0a0a0a' }}>Termos de Uso</h1>
          <p className="text-gray-500 mt-2 text-sm">Última atualização: março de 2026</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 space-y-10">

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. O que é o Marcaí</h2>
            <p className="text-gray-600 leading-relaxed">
              O Marcaí é uma plataforma de agendamento online voltada para pequenos negócios e profissionais autônomos brasileiros. Por meio de um link personalizado, seus clientes podem agendar serviços diretamente pelo celular, sem precisar baixar nenhum aplicativo. Você recebe confirmações automáticas via WhatsApp.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              O acesso e uso do Marcaí estão condicionados à aceitação destes Termos de Uso. Ao criar uma conta, você declara ter lido, compreendido e concordado com todas as condições aqui descritas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Como usar o serviço</h2>
            <p className="text-gray-600 leading-relaxed">
              Para utilizar o Marcaí, você deve criar uma conta com um endereço de e-mail válido e uma senha. Após o cadastro, você poderá configurar seu negócio, definir os serviços oferecidos e compartilhar seu link de agendamento com seus clientes.
            </p>
            <ul className="mt-3 space-y-2 text-gray-600">
              <li className="flex gap-2"><span className="text-[#25D366] font-bold flex-shrink-0">✓</span> Cada conta está vinculada a um único negócio por padrão.</li>
              <li className="flex gap-2"><span className="text-[#25D366] font-bold flex-shrink-0">✓</span> O link de agendamento é público e pode ser compartilhado por qualquer canal (WhatsApp, Instagram, etc.).</li>
              <li className="flex gap-2"><span className="text-[#25D366] font-bold flex-shrink-0">✓</span> Você é responsável por manter suas credenciais de acesso em segurança.</li>
              <li className="flex gap-2"><span className="text-[#25D366] font-bold flex-shrink-0">✓</span> É proibido usar o serviço para fins ilegais, fraudulentos ou que causem dano a terceiros.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Responsabilidades do usuário</h2>
            <p className="text-gray-600 leading-relaxed">
              Ao usar o Marcaí, você se compromete a:
            </p>
            <ul className="mt-3 space-y-2 text-gray-600">
              <li className="flex gap-2"><span className="text-[#25D366] font-bold flex-shrink-0">✓</span> Fornecer informações verdadeiras e atualizadas sobre seu negócio e sobre você.</li>
              <li className="flex gap-2"><span className="text-[#25D366] font-bold flex-shrink-0">✓</span> Não utilizar o serviço para enviar spam ou comunicações não solicitadas a clientes.</li>
              <li className="flex gap-2"><span className="text-[#25D366] font-bold flex-shrink-0">✓</span> Honrar os agendamentos realizados pelos seus clientes através da plataforma.</li>
              <li className="flex gap-2"><span className="text-[#25D366] font-bold flex-shrink-0">✓</span> Manter o número de WhatsApp cadastrado ativo e funcional para receber as notificações.</li>
              <li className="flex gap-2"><span className="text-[#25D366] font-bold flex-shrink-0">✓</span> Não tentar acessar contas de outros usuários nem realizar engenharia reversa na plataforma.</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              O descumprimento dessas condições pode resultar na suspensão ou cancelamento imediato da sua conta, sem direito a reembolso do período já pago.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Responsabilidades do Marcaí</h2>
            <p className="text-gray-600 leading-relaxed">
              O Marcaí se compromete a:
            </p>
            <ul className="mt-3 space-y-2 text-gray-600">
              <li className="flex gap-2"><span className="text-[#25D366] font-bold flex-shrink-0">✓</span> Manter a plataforma disponível com esforços razoáveis de disponibilidade e estabilidade.</li>
              <li className="flex gap-2"><span className="text-[#25D366] font-bold flex-shrink-0">✓</span> Notificar os usuários com antecedência em caso de manutenções programadas que afetem o serviço.</li>
              <li className="flex gap-2"><span className="text-[#25D366] font-bold flex-shrink-0">✓</span> Tratar os dados dos usuários conforme nossa Política de Privacidade e a LGPD.</li>
              <li className="flex gap-2"><span className="text-[#25D366] font-bold flex-shrink-0">✓</span> Oferecer suporte para dúvidas e problemas relacionados ao funcionamento da plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Limitação de responsabilidade</h2>
            <p className="text-gray-600 leading-relaxed">
              O Marcaí é uma ferramenta de gestão de agendamentos e atua como intermediário tecnológico. Não somos responsáveis pelo cumprimento dos serviços contratados entre você e seus clientes, por eventuais falhas no envio de mensagens WhatsApp causadas por indisponibilidade de terceiros (como Z-API ou operadoras), nem por perdas de negócio decorrentes de interrupções temporárias no serviço.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              Em nenhuma hipótese a responsabilidade total do Marcaí perante um usuário excederá o valor pago pelo plano nos últimos 3 (três) meses.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Cancelamento de conta</h2>
            <p className="text-gray-600 leading-relaxed">
              Você pode cancelar sua conta a qualquer momento, sem necessidade de justificativa. Para isso, entre em contato pelo e-mail indicado na seção "Contato" abaixo. Após o cancelamento:
            </p>
            <ul className="mt-3 space-y-2 text-gray-600">
              <li className="flex gap-2"><span className="text-[#25D366] font-bold flex-shrink-0">✓</span> Seu link de agendamento será desativado imediatamente.</li>
              <li className="flex gap-2"><span className="text-[#25D366] font-bold flex-shrink-0">✓</span> Seus dados serão excluídos de acordo com nossa Política de Privacidade.</li>
              <li className="flex gap-2"><span className="text-[#25D366] font-bold flex-shrink-0">✓</span> Não realizamos reembolso proporcional de períodos já cobrados, salvo quando exigido por lei.</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              O Marcaí também pode cancelar sua conta em caso de violação destes termos, com ou sem aviso prévio, dependendo da gravidade da infração.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Alterações nos termos</h2>
            <p className="text-gray-600 leading-relaxed">
              O Marcaí pode atualizar estes Termos de Uso periodicamente. Quando isso ocorrer, notificaremos os usuários por e-mail com pelo menos 15 (quinze) dias de antecedência antes das mudanças entrarem em vigor. O uso continuado da plataforma após esse prazo implica na aceitação dos novos termos.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              Recomendamos que você revisite esta página periodicamente. A data da última atualização está sempre indicada no topo deste documento.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Legislação aplicável</h2>
            <p className="text-gray-600 leading-relaxed">
              Estes Termos de Uso são regidos pelas leis brasileiras. Qualquer disputa decorrente do uso da plataforma será submetida ao foro da comarca de São Paulo — SP, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Contato</h2>
            <p className="text-gray-600 leading-relaxed">
              Em caso de dúvidas sobre estes Termos de Uso ou para solicitar o cancelamento da sua conta, entre em contato pelo e-mail:
            </p>
            <p className="mt-3 font-semibold text-gray-800">contato@marcai.net.br</p>
            <p className="text-gray-500 text-sm mt-1">Respondemos em até 2 dias úteis.</p>
          </section>

        </div>
      </div>
      </div>
    </div>
  )
}
