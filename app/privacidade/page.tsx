import Link from 'next/link'
import LandingHeader from '../components/LandingHeader'
import LandingFooter from '../components/LandingFooter'
import { Check } from 'lucide-react'

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen">
      <LandingHeader />
      <div className="py-12 md:py-16 px-6">
      {/* Leitura confortável: coluna de ~720px, corpo 15–16px. */}
      <div className="max-w-[720px] mx-auto">

        <div className="mb-10">
          <p className="t-caps mb-3">Legal</p>
          <h1 className="text-[32px] md:text-[40px] font-semibold leading-[1.1] tracking-[-0.03em] text-fg">Política de Privacidade</h1>
          <p className="text-sm text-muted mt-3">Última atualização: outubro de 2026 — Em conformidade com a Lei nº 13.709/2018 (LGPD)</p>
        </div>

        <div className="card !p-6 sm:!p-10 space-y-10">

          <section>
            <p className="text-[15px] md:text-base text-muted leading-relaxed">
              O Marcaí valoriza a privacidade dos seus usuários e dos clientes que utilizam nosso sistema de agendamento. Esta Política de Privacidade explica de forma transparente quais dados coletamos, como os utilizamos, com quem os compartilhamos e quais são seus direitos como titular de dados, em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018).
            </p>
          </section>

          <section>
            <h2 className="t-section text-[19px] md:text-[20px] mb-3">1. Quais dados coletamos</h2>
            <p className="text-[15px] md:text-base text-muted leading-relaxed mb-4">
              Coletamos dados em dois contextos distintos: dos <strong className="font-semibold text-fg">usuários do Marcaí</strong> (donos de negócio) e dos <strong className="font-semibold text-fg">clientes finais</strong> (quem realiza agendamentos).
            </p>

            <h3 className="text-base font-semibold text-fg mb-2">Usuários cadastrados (donos de negócio)</h3>
            <ul className="space-y-2 text-[15px] md:text-base text-muted leading-relaxed mb-5">
              <li className="flex gap-2"><Check size={14} strokeWidth={1.8} className="text-faint flex-shrink-0 mt-[5px]" aria-hidden /> <strong className="font-semibold text-fg">E-mail</strong> — usado para autenticação e comunicações da plataforma.</li>
              <li className="flex gap-2"><Check size={14} strokeWidth={1.8} className="text-faint flex-shrink-0 mt-[5px]" aria-hidden /> <strong className="font-semibold text-fg">Nome completo</strong> — exibido no painel e usado para personalização.</li>
              <li className="flex gap-2"><Check size={14} strokeWidth={1.8} className="text-faint flex-shrink-0 mt-[5px]" aria-hidden /> <strong className="font-semibold text-fg">Número de telefone / WhatsApp</strong> — usado para enviar notificações de agendamentos.</li>
              <li className="flex gap-2"><Check size={14} strokeWidth={1.8} className="text-faint flex-shrink-0 mt-[5px]" aria-hidden /> <strong className="font-semibold text-fg">Dados do negócio</strong> — nome, tipo, slug (link público) e telefone de contato.</li>
              <li className="flex gap-2"><Check size={14} strokeWidth={1.8} className="text-faint flex-shrink-0 mt-[5px]" aria-hidden /> <strong className="font-semibold text-fg">Dados de uso</strong> — logs de acesso e interações com a plataforma para fins de segurança e melhorias.</li>
            </ul>

            <h3 className="text-base font-semibold text-fg mb-2">Clientes finais (quem agenda)</h3>
            <ul className="space-y-2 text-[15px] md:text-base text-muted leading-relaxed">
              <li className="flex gap-2"><Check size={14} strokeWidth={1.8} className="text-faint flex-shrink-0 mt-[5px]" aria-hidden /> <strong className="font-semibold text-fg">Nome</strong> — para identificação no agendamento.</li>
              <li className="flex gap-2"><Check size={14} strokeWidth={1.8} className="text-faint flex-shrink-0 mt-[5px]" aria-hidden /> <strong className="font-semibold text-fg">Telefone / WhatsApp</strong> — para envio da confirmação automática do agendamento.</li>
              <li className="flex gap-2"><Check size={14} strokeWidth={1.8} className="text-faint flex-shrink-0 mt-[5px]" aria-hidden /> <strong className="font-semibold text-fg">Dados do agendamento</strong> — serviço solicitado, data e horário escolhidos.</li>
            </ul>
            <p className="t-cap text-[13px] mt-3">
              Não coletamos CPF, dados bancários, localização, cookies de rastreamento ou qualquer dado sensível definido pelo Art. 5º, II da LGPD.
            </p>
          </section>

          <section>
            <h2 className="t-section text-[19px] md:text-[20px] mb-3">2. Como usamos os dados</h2>
            <p className="text-[15px] md:text-base text-muted leading-relaxed mb-3">
              Utilizamos os dados coletados exclusivamente para as seguintes finalidades:
            </p>
            <ul className="space-y-2 text-[15px] md:text-base text-muted leading-relaxed">
              <li className="flex gap-2"><Check size={14} strokeWidth={1.8} className="text-faint flex-shrink-0 mt-[5px]" aria-hidden /> Autenticar usuários e manter sessões seguras na plataforma.</li>
              <li className="flex gap-2"><Check size={14} strokeWidth={1.8} className="text-faint flex-shrink-0 mt-[5px]" aria-hidden /> Exibir e gerenciar os agendamentos no painel do usuário.</li>
              <li className="flex gap-2"><Check size={14} strokeWidth={1.8} className="text-faint flex-shrink-0 mt-[5px]" aria-hidden /> Enviar mensagens de confirmação de agendamento via WhatsApp para o cliente e para o dono do negócio.</li>
              <li className="flex gap-2"><Check size={14} strokeWidth={1.8} className="text-faint flex-shrink-0 mt-[5px]" aria-hidden /> Enviar comunicações sobre o serviço, como avisos de manutenção e atualizações nos termos.</li>
              <li className="flex gap-2"><Check size={14} strokeWidth={1.8} className="text-faint flex-shrink-0 mt-[5px]" aria-hidden /> Melhorar continuamente a plataforma com base em padrões de uso anonimizados.</li>
            </ul>
            <p className="text-[15px] md:text-base text-muted leading-relaxed mt-3">
              Não vendemos seus dados a ninguém. Também não usamos os dados de agendamento — nem os seus, nem os dos seus clientes — para publicidade. O único uso ligado a anúncios é o cookie da Meta descrito na seção 4, que só funciona nas nossas páginas de divulgação e de cadastro, e só se você aceitar.
            </p>
          </section>

          <section>
            <h2 className="t-section text-[19px] md:text-[20px] mb-3">3. Com quem compartilhamos os dados</h2>
            <p className="text-[15px] md:text-base text-muted leading-relaxed mb-4">
              Para operar o Marcaí, utilizamos fornecedores terceiros de confiança. Compartilhamos dados apenas na medida necessária para o funcionamento do serviço:
            </p>

            <div>
              <div className="py-4 border-t border-hairline first:border-t-0">
                <p className="font-semibold text-fg mb-1">Supabase</p>
                <p className="text-[15px] text-muted leading-relaxed">
                  Utilizado como banco de dados e sistema de autenticação. Todos os dados de usuários, negócios e agendamentos são armazenados nos servidores do Supabase. A empresa é aderente ao GDPR e adota padrões rigorosos de segurança. Saiba mais em <span className="font-medium text-fg">supabase.com/privacy</span>.
                </p>
              </div>

              <div className="py-4 border-t border-hairline first:border-t-0">
                <p className="font-semibold text-fg mb-1">Z-API</p>
                <p className="text-[15px] text-muted leading-relaxed">
                  Utilizado para o envio de mensagens de confirmação via WhatsApp. Transmitimos o número de telefone e o texto da mensagem para a API da Z-API exclusivamente no momento do envio. Não armazenamos dados no Z-API além do necessário para a entrega da mensagem. Saiba mais em <span className="font-medium text-fg">z-api.io</span>.
                </p>
              </div>
              <div className="py-4 border-t border-hairline first:border-t-0">
                <p className="font-semibold text-fg mb-1">Asaas</p>
                <p className="text-[15px] text-muted leading-relaxed">
                  Utilizado para a cobrança da assinatura dos planos pagos. Quando você assina, enviamos ao Asaas o seu nome, e-mail e CPF, além do plano escolhido e do valor, para emitir as cobranças. Os dados de pagamento, como cartão, são informados por você diretamente no Asaas, e o Marcaí não tem acesso a eles. Dados de agendamentos e de clientes finais nunca são enviados ao Asaas.
                </p>
              </div>

              <div className="py-4 border-t border-hairline first:border-t-0">
                <p className="font-semibold text-fg mb-1">Vercel</p>
                <p className="text-[15px] text-muted leading-relaxed">
                  Empresa que hospeda o site do Marcaí. Ao acessar qualquer página, a Vercel registra informações técnicas da visita — endereço IP, navegador, página acessada e horário — para entregar o site e manter a segurança. Esses registros são usados apenas para operação e não para publicidade. Saiba mais em <span className="font-medium text-fg">vercel.com/legal/privacy-notice</span>.
                </p>
              </div>

              <div className="py-4 border-t border-hairline first:border-t-0">
                <p className="font-semibold text-fg mb-1">Meta (Facebook e Instagram)</p>
                <p className="text-[15px] text-muted leading-relaxed">
                  Usamos o Meta Pixel para medir se os nossos anúncios trazem novos cadastros. Ele só é ativado se você clicar em &quot;Aceitar&quot; no aviso de cookies, e só na página inicial e na tela de cadastro de negócio. Quando ativo, a Meta recebe informações técnicas da visita — páginas vistas, o aviso de que um cadastro foi concluído, dados do navegador e endereço IP — e pode associá-las à sua conta no Facebook ou Instagram, se você tiver uma. Não enviamos à Meta nome, e-mail, telefone, CPF nem nenhum dado de agendamento. Saiba mais em <span className="font-medium text-fg">facebook.com/privacy/policy</span>.
                </p>
              </div>
            </div>

            <p className="t-cap text-[13px] mt-4">
              Fora os fornecedores listados acima, não compartilhamos dados com outras empresas. Não vendemos dados, e nenhum dado dos clientes finais (quem agenda) é compartilhado com anunciantes.
            </p>
          </section>

          <section id="cookies" className="scroll-mt-24">
            <h2 className="t-section text-[19px] md:text-[20px] mb-3">4. Cookies e rastreamento</h2>
            <p className="text-[15px] md:text-base text-muted leading-relaxed mb-3">
              O Marcaí usa dois tipos de armazenamento no seu navegador:
            </p>
            <ul className="space-y-2 text-[15px] md:text-base text-muted leading-relaxed mb-4">
              <li className="flex gap-2"><Check size={14} strokeWidth={1.8} className="text-faint flex-shrink-0 mt-[5px]" aria-hidden /> <span><strong className="font-semibold text-fg">Essenciais</strong> — mantêm você logado e guardam a sua escolha sobre cookies. Sem eles o site não funciona, por isso não pedimos consentimento para eles.</span></li>
              <li className="flex gap-2"><Check size={14} strokeWidth={1.8} className="text-faint flex-shrink-0 mt-[5px]" aria-hidden /> <span><strong className="font-semibold text-fg">De publicidade (Meta Pixel)</strong> — cookies da Meta, como o <code className="text-sm bg-fill rounded-tag px-1">_fbp</code>, usados para medir os nossos anúncios. Só são gravados se você aceitar.</span></li>
            </ul>
            <p className="text-[15px] md:text-base text-muted leading-relaxed mb-3">
              <strong className="font-semibold text-fg">Onde o Pixel pode funcionar:</strong> apenas na página inicial (marcai.net.br) e na tela de cadastro de negócio. Ele nunca é carregado no link de agendamento que você compartilha com seus clientes, no painel de quem tem conta, nem na área do cliente. Quem agenda pelo Marcaí não é rastreado por nós.
            </p>
            <p className="text-[15px] md:text-base text-muted leading-relaxed mb-3">
              <strong className="font-semibold text-fg">Sem dados pessoais:</strong> além da visita, o único evento enviado é o aviso de &quot;cadastro concluído&quot;, sem nome, e-mail, telefone ou CPF.
            </p>
            <p className="text-[15px] md:text-base text-muted leading-relaxed">
              <strong className="font-semibold text-fg">Base legal e como mudar de ideia:</strong> esses cookies dependem do seu consentimento (Art. 7º, I, da LGPD), que você pode retirar a qualquer momento. Abra <Link href="/?rever_cookies=1" className="link">marcai.net.br/?rever_cookies=1</Link> para ver o aviso de novo, ou apague os dados do site nas configurações do navegador. Você também pode limitar anúncios nas configurações da sua conta na Meta.
            </p>
          </section>

          <section>
            <h2 className="t-section text-[19px] md:text-[20px] mb-3">5. Por quanto tempo armazenamos os dados</h2>
            <ul className="space-y-2 text-[15px] md:text-base text-muted leading-relaxed">
              <li className="flex gap-2"><Check size={14} strokeWidth={1.8} className="text-faint flex-shrink-0 mt-[5px]" aria-hidden /> <strong className="font-semibold text-fg">Dados de conta ativa</strong> — mantidos enquanto a conta estiver ativa.</li>
              <li className="flex gap-2"><Check size={14} strokeWidth={1.8} className="text-faint flex-shrink-0 mt-[5px]" aria-hidden /> <strong className="font-semibold text-fg">Dados de agendamentos</strong> — armazenados por até 12 meses após a data do agendamento para fins de histórico.</li>
              <li className="flex gap-2"><Check size={14} strokeWidth={1.8} className="text-faint flex-shrink-0 mt-[5px]" aria-hidden /> <strong className="font-semibold text-fg">Após cancelamento da conta</strong> — os dados são excluídos em até 30 dias corridos após a solicitação.</li>
              <li className="flex gap-2"><Check size={14} strokeWidth={1.8} className="text-faint flex-shrink-0 mt-[5px]" aria-hidden /> <strong className="font-semibold text-fg">Logs de segurança</strong> — retidos por até 6 meses para fins de auditoria e prevenção a fraudes.</li>
            </ul>
          </section>

          <section>
            <h2 className="t-section text-[19px] md:text-[20px] mb-3">6. Direitos do titular dos dados</h2>
            <p className="text-[15px] md:text-base text-muted leading-relaxed mb-3">
              Em conformidade com os Art. 17 a 22 da LGPD, você tem os seguintes direitos sobre seus dados pessoais:
            </p>
            <ul className="space-y-2 text-[15px] md:text-base text-muted leading-relaxed">
              <li className="flex gap-2"><Check size={14} strokeWidth={1.8} className="text-faint flex-shrink-0 mt-[5px]" aria-hidden /> <strong className="font-semibold text-fg">Acesso</strong> — solicitar uma cópia de todos os dados que temos sobre você.</li>
              <li className="flex gap-2"><Check size={14} strokeWidth={1.8} className="text-faint flex-shrink-0 mt-[5px]" aria-hidden /> <strong className="font-semibold text-fg">Correção</strong> — atualizar dados incorretos ou desatualizados diretamente pelo painel ou por solicitação.</li>
              <li className="flex gap-2"><Check size={14} strokeWidth={1.8} className="text-faint flex-shrink-0 mt-[5px]" aria-hidden /> <strong className="font-semibold text-fg">Exclusão</strong> — solicitar a remoção dos seus dados pessoais da nossa base.</li>
              <li className="flex gap-2"><Check size={14} strokeWidth={1.8} className="text-faint flex-shrink-0 mt-[5px]" aria-hidden /> <strong className="font-semibold text-fg">Portabilidade</strong> — receber seus dados em formato estruturado para uso em outro serviço.</li>
              <li className="flex gap-2"><Check size={14} strokeWidth={1.8} className="text-faint flex-shrink-0 mt-[5px]" aria-hidden /> <strong className="font-semibold text-fg">Revogação de consentimento</strong> — retirar o consentimento para tratamento de dados a qualquer momento.</li>
              <li className="flex gap-2"><Check size={14} strokeWidth={1.8} className="text-faint flex-shrink-0 mt-[5px]" aria-hidden /> <strong className="font-semibold text-fg">Informação</strong> — saber com quais terceiros seus dados foram compartilhados.</li>
            </ul>
            <p className="text-[15px] md:text-base text-muted leading-relaxed mt-3">
              Para exercer qualquer um desses direitos, entre em contato pelo canal indicado na seção abaixo. Atendemos todas as solicitações em até 15 dias corridos, conforme previsto na LGPD.
            </p>
          </section>

          <section>
            <h2 className="t-section text-[19px] md:text-[20px] mb-3">7. Segurança dos dados</h2>
            <p className="text-[15px] md:text-base text-muted leading-relaxed">
              Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, perda ou alteração indevida, incluindo: comunicação criptografada via HTTPS, autenticação gerenciada pelo Supabase com armazenamento seguro de senhas (hashing), e controle de acesso por função. Nenhum sistema é 100% invulnerável, mas nos comprometemos a agir com diligência e a comunicar incidentes de segurança relevantes à Autoridade Nacional de Proteção de Dados (ANPD) e aos usuários afetados, conforme exigido pela LGPD.
            </p>
          </section>

          <section>
            <h2 className="t-section text-[19px] md:text-[20px] mb-3">8. Contato e encarregado de dados (DPO)</h2>
            <p className="text-[15px] md:text-base text-muted leading-relaxed">
              Para exercer seus direitos, tirar dúvidas sobre esta Política ou solicitar a exclusão dos seus dados, entre em contato:
            </p>
            <div className="mt-4 bg-fill rounded-inner p-5">
              <p className="font-semibold text-fg">Marcaí — Encarregado de Proteção de Dados</p>
              <p className="text-muted mt-1">E-mail: <span className="font-medium text-fg">privacidade@marcai.net.br</span></p>
              <p className="t-cap text-[13px] mt-1">Respondemos em até 15 dias corridos, conforme a LGPD.</p>
            </div>
          </section>

        </div>
      </div>
      </div>
      <LandingFooter />
    </div>
  )
}
