import type { Metadata } from 'next'
import Link from 'next/link'
import { EMPRESA } from '../_components/empresa'
import { LegalPage, Secao, Lista } from '../_components/Legal'

export const metadata: Metadata = { title: 'Termos de uso' }

export default function SpoolTermosPage() {
  return (
    <LegalPage titulo="Termos de uso do Spool" atualizado="27 de novembro de 2026">
      <p>
        <a href="#en" className="link">English version below</a>.
      </p>

      <Secao titulo="Quem oferece">
        <p>
          O Spool é desenvolvido e mantido pela <strong className="font-semibold text-fg">{EMPRESA.razao}</strong>, CNPJ{' '}
          {EMPRESA.cnpj} (&quot;Marcai&quot;). Ao usar o Spool, você concorda com estes termos e com a{' '}
          <Link href="/spool/privacidade" className="link">Política de privacidade</Link>.
        </p>
      </Secao>

      <Secao titulo="O que o Spool faz">
        <p>
          O Spool agenda e publica posts nas contas que você mesmo conecta (YouTube, Instagram, páginas do LinkedIn e TikTok), sempre
          pelas APIs oficiais de cada rede e só com a sua autorização no login de cada uma, e mostra números básicos dos posts. Ele roda no
          computador de quem usa (Mac). Novos usuários entram por convite da Marcai.
        </p>
      </Secao>

      <Secao titulo="Suas responsabilidades">
        <Lista
          itens={[
            'Conectar só contas que você tem o direito de administrar.',
            'Ser responsável pelo conteúdo que agenda (textos, vídeos, fotos, músicas e marcas), inclusive direitos autorais e de imagem.',
            'Seguir os termos e as regras de cada rede, como as Diretrizes da Comunidade do TikTok, a Confirmação de Uso de Música e a Política de Conteúdo de Marca do TikTok, e os termos do YouTube, da Meta e do LinkedIn.',
            'Indicar corretamente quando um post é conteúdo comercial ou parceria paga, quando a rede pedir.',
          ]}
        />
      </Secao>

      <Secao titulo="Como funciona a publicação">
        <p>
          O Spool nunca publica nada que você não tenha agendado. Ele confere cada post na rede antes de marcar como publicado. Algumas
          redes não agendam sozinhas: nesses casos o app publica na hora marcada, e o computador precisa estar ligado e com internet. As
          redes podem recusar, atrasar ou limitar publicações por regras próprias (por exemplo, limites diários ou revisão de conteúdo);
          quando isso acontece, o app avisa e não tenta publicar de novo às cegas.
        </p>
      </Secao>

      <Secao titulo="Limites">
        <p>
          O Spool é oferecido como está. A Marcai não garante que as redes vão aceitar ou manter cada publicação, e
          não responde por decisões das redes sobre contas ou conteúdos. Você pode parar de usar e desconectar suas contas a qualquer
          momento (veja a Política de privacidade).
        </p>
      </Secao>

      <Secao titulo="Mudanças e contato">
        <p>
          Estes termos podem mudar; a data no topo mostra a versão atual. Dúvidas:{' '}
          <a href={`mailto:${EMPRESA.email}`} className="link">{EMPRESA.email}</a>. Estes termos
          seguem as leis do Brasil.
        </p>
      </Secao>

      <div id="en" lang="en" className="scroll-mt-24 border-t border-hairline pt-9 space-y-3">
        <h2 className="t-section text-[17px]">Terms of Service (English)</h2>
        <p>
          Spool is developed and maintained by {EMPRESA.razao} (Brazilian company, CNPJ {EMPRESA.cnpj}). By using it you agree to these
          terms and to the <Link href="/spool/privacidade#en" className="link">Privacy Policy</Link>.
          Spool schedules and publishes posts to accounts you connect yourself (YouTube, Instagram, LinkedIn Pages and TikTok), only
          through each network&apos;s official API and with your authorization, and shows basic post analytics. It runs on the
          user&apos;s own computer (Mac); new users join by invitation from Marcai.
        </p>
        <p>
          You must only connect accounts you are allowed to manage, you are responsible for the content you schedule (including
          copyright, music and likeness rights), and you must follow each network&apos;s terms and policies, including TikTok&apos;s Community
          Guidelines, Music Usage Confirmation and Branded Content Policy, and disclose commercial content when required.
        </p>
        <p>
          Spool never publishes anything you did not schedule and checks each post on the network before marking it as published.
          Networks may reject, delay or limit posts under their own rules; the app reports this and never blindly re-publishes. The
          service is provided as is; Marcai does not guarantee that networks will accept or keep any post. You can stop
          using it and disconnect your accounts at any time. Contact:{' '}
          <a href={`mailto:${EMPRESA.email}`} className="link">{EMPRESA.email}</a>. These terms are
          governed by Brazilian law.
        </p>
      </div>
    </LegalPage>
  )
}
