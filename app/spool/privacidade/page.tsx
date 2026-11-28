import type { Metadata } from 'next'
import Link from 'next/link'
import { EMPRESA } from '../_components/empresa'
import { LegalPage, Secao, Lista } from '../_components/Legal'

export const metadata: Metadata = { title: 'Política de privacidade' }

const b = (t: string) => <strong className="font-semibold text-fg">{t}</strong>

export default function SpoolPrivacidadePage() {
  return (
    <LegalPage titulo="Política de privacidade do Spool" atualizado="27 de novembro de 2026">
      <p>
        Veja também os <Link href="/spool/termos" className="link">Termos de uso</Link>.{' '}
        <a href="#en" className="link">English version below</a>.
      </p>

      <Secao titulo="Quem é o responsável">
        <p>
          O Spool é desenvolvido e mantido pela {b(EMPRESA.razao)}, CNPJ {EMPRESA.cnpj}, com sede em {EMPRESA.endereco} (&quot;Marcai&quot;),
          responsável pelo tratamento dos dados descritos aqui, nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
        </p>
      </Secao>

      <Secao titulo="O que é">
        <p>
          O Spool é um aplicativo que agenda publicações nas redes sociais pelas APIs oficiais de cada rede e mostra números básicos
          dos posts. Ele roda no computador de quem usa (Mac). Hoje é usado nas contas
          que a própria Marcai administra, e novos usuários entram por convite.
        </p>
      </Secao>

      <Secao titulo="Quais dados usa">
        <p>Só com a autorização dada pelo titular da conta, no login oficial de cada rede:</p>
        <Lista
          itens={[
            <>{b('YouTube (Google):')} nome, ID e foto do canal; envio de vídeos; título, descrição e horário de publicação; conferência de que o vídeo foi publicado; remoção ou volta para &quot;privado&quot; de vídeos agendados que forem cancelados; e números públicos do canal e dos vídeos (inscritos, visualizações, curtidas e comentários), para a tela de resultados.</>,
            <>{b('Instagram (Meta):')} nome de usuário, ID e foto da conta profissional; envio de fotos, carrosséis e vídeos com legenda; conferência de que o post foi publicado e do limite de publicações da conta; e a lista de posts da conta com seus números (curtidas, comentários, alcance e visualizações), para a tela de resultados. A conta pode ser conectada pelo login do Facebook ou direto pelo login do Instagram.</>,
            <>{b('TikTok:')} nome, foto e identificação da conta; quem pode ver e as opções de interação permitidas pela conta (consultadas a cada post, como o TikTok exige); envio de vídeos com legenda e as escolhas feitas por quem posta (privacidade, comentários, dueto, costura e divulgação comercial), ou envio para a caixa de entrada do app do TikTok; conferência de que o vídeo foi publicado.</>,
            <>{b('LinkedIn:')} lista das páginas de empresa que a pessoa administra (nome e ID); envio de textos, fotos, vídeos, documentos e enquetes para essas páginas; conferência de que o post foi publicado.</>,
          ]}
        />
        <p>O app não lê mensagens, não lê o conteúdo de comentários, não lê listas de seguidores e não lê dados de outras pessoas.</p>
      </Secao>

      <Secao titulo="Onde os dados ficam">
        <p>
          Tudo fica no computador onde o app roda: os posts, os arquivos, os números e o histórico num banco de dados local, e as
          credenciais de acesso no Chaveiro do macOS. Não existem servidores do Spool. Os dados só são enviados para a própria rede
          (Google/YouTube, Meta/Instagram, LinkedIn ou TikTok), para fazer o que foi pedido. Para o Instagram buscar uma foto ou um
          vídeo, o app abre um link temporário e privado para aquele arquivo, que deixa de funcionar assim que a rede termina de buscá-lo.
        </p>
      </Secao>

      <Secao titulo="Como os dados são protegidos">
        <Lista
          itens={[
            <>{b('Credenciais criptografadas:')} os tokens de acesso permanentes (refresh tokens) e as chaves dos apps ficam no Chaveiro do macOS, que guarda os itens criptografados e só os libera para o usuário logado naquele computador. Eles nunca são gravados em arquivos de texto nem no banco de dados. Os tokens temporários de cada sessão ficam só na memória do app e expiram em cerca de uma hora.</>,
            <>{b('Conexões criptografadas:')} toda comunicação com o Google/YouTube, a Meta, o LinkedIn e o TikTok é feita por HTTPS (TLS). O login usa o fluxo OAuth oficial de cada rede com PKCE; o Spool nunca vê nem guarda senhas.</>,
            <>{b('Sem acesso pela rede:')} a tela do app só aceita conexões do próprio computador (endereço 127.0.0.1); ninguém de fora consegue abri-la.</>,
            <>{b('Sem servidores e sem cópias:')} não existe servidor do Spool nem cópia dos dados com a Marcai ou com terceiros. Os dados das redes (como números de visualizações) ficam só no banco local e servem apenas para mostrar o status e os resultados dos posts de quem conectou a conta.</>,
            <>{b('Acesso mínimo e guarda limitada:')} o app pede só as permissões necessárias para agendar, editar, cancelar e conferir os próprios posts. Ao remover uma conta, o Spool apaga a credencial do Chaveiro e, no Google e no TikTok, também pede à rede a revogação do acesso; nas outras redes, o acesso pode ser removido nas configurações da própria rede (lista abaixo). Remover o app apaga todos os dados locais.</>,
            <>{b('Proteção do computador:')} recomendamos usar o app em computador com senha de usuário e criptografia de disco ativada (FileVault no macOS).</>,
          ]}
        />
      </Secao>

      <Secao titulo="Compartilhamento">
        <p>
          O app não vende, não compartilha e não transfere dados para terceiros, e não usa dados para publicidade. O uso das
          informações recebidas das APIs do Google segue a Política de Dados do Usuário dos Serviços de API do Google, incluindo os
          requisitos de Uso Limitado.
        </p>
      </Secao>

      <Secao titulo="Como remover o acesso e apagar os dados">
        <Lista
          itens={[
            <>No próprio app, em Contas, &quot;Remover&quot; desconecta a conta e apaga o acesso guardado.</>,
            <>Google: myaccount.google.com/permissions.</>,
            <>Instagram/Facebook: Configurações › Apps e sites (ou Integrações empresariais) › remover o Spool.</>,
            <>TikTok: no app do TikTok, Configurações e privacidade › Segurança › Apps e serviços conectados › remover o Spool.</>,
            <>LinkedIn: Configurações › Serviços permitidos.</>,
            <>Remover o app do computador apaga todos os dados locais.</>,
          ]}
        />
      </Secao>

      <Secao titulo="Seus direitos e contato">
        <p>
          Você pode pedir a qualquer momento acesso, correção ou exclusão dos seus dados. Dúvidas ou pedidos:{' '}
          <a href={`mailto:${EMPRESA.email}`} className="link">{EMPRESA.email}</a>.
        </p>
      </Secao>

      <div id="en" lang="en" className="scroll-mt-24 border-t border-hairline pt-9 space-y-3">
        <h2 className="t-section text-[17px]">Privacy Policy (English)</h2>
        <p>
          Spool is developed and maintained by {EMPRESA.razao} (Brazilian company, CNPJ {EMPRESA.cnpj}, {EMPRESA.endereco}), which is
          responsible for the data described here. It schedules posts through each network&apos;s official API and shows basic post
          analytics. It runs on the user&apos;s own computer (Mac). Today it is used for the
          accounts Marcai manages, and new users join by invitation.
        </p>
        <p>
          With the account holder&apos;s authorization it uses: the YouTube Data API (channel name, ID and picture; video upload; title,
          description and publish time; publish check; removing or making private scheduled videos that are cancelled; public channel and
          video statistics for the analytics screen), the Instagram API with Facebook Login or Instagram Login (professional account
          username, ID and picture; publishing photos, carousels and videos with captions; publish check and publishing limit; the
          account&apos;s media list with likes, comments, reach and views for the analytics screen), the LinkedIn Community Management API
          (pages the person administers; publishing text, images, videos, documents and polls to those pages; publish check), and the
          TikTok Content Posting API (account name, picture and id; the privacy and interaction options available to the account, queried
          before each post as TikTok requires; uploading videos with captions and the poster&apos;s choices for privacy, comments, duet,
          stitch and commercial content disclosure, or sending them to the TikTok app inbox; publish check). It does not read messages,
          comment text, follower lists or other people&apos;s data.
        </p>
        <p>
          All data stays on the computer where the app runs (local database; credentials in the macOS Keychain). There are no Spool
          servers; data is only sent to the network itself to perform the requested action.
        </p>
        <p>
          How data is protected: long-lived OAuth refresh tokens and app keys are stored encrypted in the macOS Keychain, which only
          releases them to the logged-in user of that computer; they are never written to plain files or to the database, and short-lived
          access tokens are kept only in memory and expire in about one hour. All communication with Google/YouTube, Meta, LinkedIn and
          TikTok uses HTTPS (TLS), and sign-in uses each network&apos;s official OAuth flow with PKCE, so Spool never sees or stores
          passwords. The app&apos;s interface only accepts connections from the same computer (127.0.0.1). There is no Spool server and
          no copy of the data with Marcai or third parties; data received from the networks (such as view counts) is kept only in the
          local database and used only to show the status and results of the connected account&apos;s own posts. Spool requests only the
          permissions needed to schedule, edit, cancel and check the user&apos;s own posts. Removing an account deletes the credential from the Keychain and, for Google and TikTok,
          also revokes the token with the network; for the other networks access can be removed in the network&apos;s own settings.
          Uninstalling the app deletes all local data. We recommend a user password and full-disk encryption (FileVault).
        </p>
        <p>
          Data is never sold, shared or used for
          advertising. Use of information received from Google APIs adheres to the Google API Services User Data Policy, including the
          Limited Use requirements. Access can be removed in the app (Contas › Remover), at myaccount.google.com/permissions, in
          Instagram/Facebook settings (Apps and websites / Business integrations), in the TikTok app (Settings and privacy › Security ›
          Apps and services) and at LinkedIn › Permitted services. Uninstalling the app deletes all local data. Contact:{' '}
          <a href={`mailto:${EMPRESA.email}`} className="link">{EMPRESA.email}</a>.
        </p>
      </div>
    </LegalPage>
  )
}
