# Marcaí: guia da marca

> **Versão 2.0 · 20/11/2026.** A marca passou a seguir o **Grafite**, o design de todos os apps do Rafa
> (`/Users/rafabitt/projects/design/grafite/`). Este guia vale para o app, o site, os posts do Instagram,
> os Reels e os anúncios. Substitui o guia antigo de posts (Poppins, fundo verde, preto `#0a0a0a`), que foi aposentado.

## Em uma frase

Calmo, neutro e preciso: fundo cinza-claro, cartões brancos, letra limpa, botões pretos em pílula e
**o verde do Marcaí só onde há informação** (o que foi confirmado, o que está livre, o que chegou no WhatsApp).

O verde deixou de ser fundo e virou sinal. É por isso que ele chama atenção.

## 1. Princípios

1. **Uma cor viva, o resto é cinza.** O verde `#25D366` aparece em dado, estado e foco: "Confirmado", o check,
   a notificação do WhatsApp, a barra de progresso, uma palavra de destaque. Nunca em fundo grande, nunca em botão.
2. **Hierarquia por peso e espaço, não por enfeite.** Número grande, rótulo pequeno em cinza, muito respiro.
   Sem gradiente, sem círculo decorativo, sem sombra pesada, sem numeral gigante transparente.
3. **O produto é o herói.** Sempre que der, mostre a tela de verdade (ou um mock feito com as mesmas peças do app).
4. **Uma caixa por nível.** Cartão dentro de cartão só quando o de dentro é bem menor (linha, campo, etiqueta).
5. **Fala simples.** Direto, confiante, brasileiro, sem corporativês (seção 9).

## 2. Logo

- **Nome:** Marcaí, sempre com o acento no "í". O check em cima do "í" é parte do logo.
- **Arquivo oficial:** `public/logo.png` (o wordmark verde, fundo transparente). Funciona sobre o cinza-claro,
  o branco e o escuro do Grafite.
- **Nunca** distorcer, girar, recolorir, contornar, pôr sombra ou redesenhar o logo à mão.
- **Nunca** pôr o logo sobre fundo verde (o fundo verde saiu da marca).
- **Respiro mínimo:** a altura do "M" em volta.
- **Tamanho mínimo:** 20 px de altura na tela; 64 px num post de 1080.
- **Assinatura dos outros apps:** os apps da empresa terminam a barra lateral com "Nome do app · um app da **Marcaí**".

## 3. Cores

Os valores exatos ficam em `app/globals.css` (web). Construa só com eles.

| Papel | Claro | Escuro | Uso |
| --- | --- | --- | --- |
| Fundo | `#F0F0F3` (com clarão branco no topo) | `#141416` | Fundo da tela, do post e do vídeo |
| Cartão | `#FFFFFF` | `#1E1E21` | Tudo o que tem conteúdo |
| Borda fina | preto 6 % | branco 8 % | Contorno do cartão, separador de linha |
| Preenchimento discreto | preto 5 % | branco 7 % | Quadradinho de ícone, etiqueta neutra, trilho |
| Texto | `#1D1D1F` | `#F5F5F7` | Títulos e texto principal |
| Texto secundário | `#5E5E63` | `#A1A1A8` | Apoio, legenda, rótulo |
| Botão principal | `#1D1D1F` com texto branco | `#F5F5F7` com texto escuro | Uma ação principal por tela ou slide |
| **Verde Marcaí** (destaque) | `#25D366` | `#25D366` | Bolinha, check, barra, mancha do cartão principal, palavra de destaque no escuro |
| **Verde para texto** | `#167E3D` | `#3DDC84` | Texto verde (o `#25D366` puro não dá para ler sobre branco) |
| Verde suave | verde 14 % sobre o cartão | verde 16 % | Fundo da etiqueta "Confirmado" |
| Erro / faltou | `#FF3B30` (texto `#B42318`) | `#FF3B30` (texto `#FF8A80`) | Só erro de verdade e "Faltou" |

**Regras**
- O verde é a única cor viva. Status neutros (realizado, cancelado, pendente, bloqueado) ficam em cinza.
- "Faltou" (`no_show`) é vermelho: é o único status que é problema.
- Texto verde sobre fundo claro é sempre `#167E3D`. O `#25D366` puro só vale como texto sobre o escuro.
- Nada de verde-claro de fundo de seção, nada de gradiente.

**O que saiu:** `#128C7E` (verde escuro antigo), `#dcfce7` (verde-claro de fundo), `#0a0a0a` (preto editorial),
`#0d2e1a` (badge escuro), `#f9f9f9`, os cinzas do Tailwind (`#6b7280`, `#9ca3af`, `#e5e7eb`), `#ef4444` e o amarelo
de "pendente".

## 4. Letra

| Onde | Fonte | Por quê |
| --- | --- | --- |
| App e site | **Fonte do sistema** (San Francisco no iPhone e no Mac, Segoe no Windows, Roboto no Android) | Regra do Grafite: o app parece do próprio aparelho. Nunca Poppins nem fonte de marca no app. |
| Posts, Reels, anúncios | **Inter** (gratuita, licença aberta) | É a mais parecida com a San Francisco. A San Francisco da Apple não pode ser usada em material de marketing. |

Escala (app/site, em px):

| Papel | Tamanho | Peso | Espaçamento |
| --- | --- | --- | --- |
| Título da tela | 24 | semibold (600) | −0,02em |
| Número grande | 32 | semibold | −0,027em |
| Corpo | 15 (16 no celular) | regular | 0 |
| Rótulo de cartão | 13 | medium, cinza | 0 |
| Legenda | 12 | regular, cinza | 0 |
| Título de grupo pequeno | 10,5 | semibold, MAIÚSCULAS | +0,06em |

Escala dos posts (1080 × 1350): ver seção 6.

- Peso máximo é **semibold (600)**. Nada de 700/800 (era a assinatura antiga, saiu).
- Número grande tem a unidade pequena e cinza ao lado: "5 **agendamentos**", "R$ 49 **/mês**".
- Horários e preços em coluna usam algarismos de largura igual (tabulares).

## 5. Forma e peças

- **Cantos:** 20 (cartão principal, janela), 16 (cartão comum), 10 (o que fica dentro: campo, linha, ícone),
  6 (etiqueta), pílula (botões, abas, horários).
- **Sombra:** curta no cartão parado; longa só no que flutua (janela, menu, banner).
- **Espaço:** grade de 4. Entre cartões 14; dentro do cartão 20; margem da tela 24 (16 no celular).
- **Botão principal:** pílula preta (branca no escuro). Secundário: pílula branca com borda fina. Um principal por tela.
- **Etiqueta de status:** canto 6, bolinha + texto. "Confirmado" verde-suave; o resto cinza; "Faltou" vermelho.
- **Quadradinho de ícone:** 28–36, canto 10, preenchimento discreto, ícone cinza de traço fino (Lucide, traço 1,8).
- **Lista:** linhas com separador fino, sem caixa por linha.
- **Cartão principal:** o único da tela com a mancha verde suave no canto.
- **Ícones:** Lucide, contorno. Nunca emoji como ícone na interface.

Para ver tudo montado: `/Users/rafabitt/projects/design/grafite/exemplo.html` e as telas do app.

## 6. Instagram (@usemarcai)

### Formato
- **Carrossel de 3 slides**, retrato **1080 × 1350** (nunca quadrado). Arquivo de trabalho em SVG (texto editável),
  publicado em JPG ou PNG.
- **Modelos prontos:** `marketing/modelos/` (gancho, desenvolvimento, chamada). Abra no Affinity ou no navegador,
  troque o texto e exporte. Precisa da fonte **Inter** instalada no Mac.
- Margem de 72 px nas laterais; nada importante a menos de 72 px da borda.

### Dois fundos (no lugar dos três temas antigos)

| Fundo | Cores | Quando |
| --- | --- | --- |
| **Claro** (padrão) | fundo `#F0F0F3`, cartões `#FFFFFF`, texto `#1D1D1F`, apoio `#5E5E63` | Conteúdo, passo a passo, produto |
| **Escuro** | fundo `#141416`, cartões `#1E1E21`, texto `#F5F5F7`, apoio `#A1A1A8` | Gancho de impacto, frase forte |

O **tema verde saiu**: nada de slide com fundo verde. A chamada final usa o fundo claro ou escuro com o botão preto
(ou branco, no escuro).

### Letra no post (Inter)

| Papel | Tamanho | Peso | Espaçamento |
| --- | --- | --- | --- |
| Título | 72–84 | semibold (600) | −0,03em |
| Resposta gigante ("Não.", "Nada.") | 160–200 | semibold | −0,04em |
| Apoio | 36–40 | regular | 0, entrelinha 1,35 |
| Rótulo do topo | 24 | semibold, MAIÚSCULAS | +0,06em, cinza |
| Rodapé ("01 / 03", "@usemarcai") | 26 | medium, cinza | 0 |

### Destaque
- **No máximo uma palavra verde por título.** No escuro, `#25D366`; no claro, `#167E3D`.
- Ou, em vez da palavra verde, o verde aparece no **dado**: etiqueta "Confirmado", check, notificação do WhatsApp,
  bolinha de "horário livre". Nunca os dois juntos competindo.
- Pode ter **uma** mancha verde suave (desfocada) no canto de um cartão por slide. Nunca círculos decorativos.

### Peças do post
- **Rótulo do topo:** texto em MAIÚSCULAS, 24 px, cinza, sem pílula colorida.
- **Rodapé:** linha fina no y = 1230; à esquerda "01 / 03"; à direita "arrasta →" (slides 1 e 2) ou "@usemarcai" (slide 3), tudo em cinza.
- **Botão de chamada:** pílula preta (`#1D1D1F`, 104 px de altura) com "marcai.net.br" em branco, 40 px, semibold.
  Embaixo, em cinza: "Grátis pra começar · sem cartão · pronto em minutos".
- **Cartão:** branco, canto 40 (o canto 20 do app dobrado, porque o post é 2× maior), borda fina, sombra curta.
- **Tela do produto:** print real do app novo (dados fictícios, ver seção 8) dentro de um cartão, ou um mock feito
  com as mesmas peças: campo de canto 20, horário em pílula, botão preto, etiqueta "Confirmado".
- **Lista de benefícios:** check verde pequeno (traço, não bola cheia) + texto em 34 px.

### Estrutura do carrossel
Gancho → desenvolvimento → chamada. O slide 3 sempre termina em `marcai.net.br` e `@usemarcai`.

### Formatos que funcionam (rodar entre eles, nunca dois iguais seguidos)
1. **Provocativo:** abre com uma dor real (perder cliente, falta, WhatsApp lotado).
2. **Educativo:** ensina algo útil sobre agenda e confirmação.
3. **Antes × depois:** dois cartões; o "antes" com ✕ cinza (não vermelho), o "depois" com ✓ verde.
4. **Como funciona:** 3 passos numa lista com quadradinho de ícone e "01/02/03" pequeno.
5. **Tira-dúvida:** cada slide uma pergunta e uma resposta gigante ("Não.", "Sim.", "Nada.").
6. **Pra quem é:** etiquetas com os nichos (barbearia, salão, clínica, nutri, personal, tattoo, manicure, estética).
7. **Mock do produto:** a tela de agendamento do cliente com a confirmação no WhatsApp.
8. **POV:** cena do dia a dia ("POV: sexta 18h e o zap não para").
9. **Depoimento ilustrativo:** sempre com a etiqueta "EXEMPLO". Nunca passar por depoimento real.
10. **Dado:** só número real e verificável. Sem fonte, reescreva sem número.
11. **Chamada / oferta:** testar grátis, sem cartão.
12. **Data / momento:** ganchos de calendário.

### Legenda e hashtags
- Gancho (1 linha) → benefício (2–3 linhas) → chamada com `marcai.net.br` ou `@usemarcai`.
- Emoji na **legenda** com parcimônia (1 a 3, só quando soma). No post e no app, nunca emoji como ícone.
- Até 15 hashtags, misturando nicho (`#barbearia #salaodebeleza #nutricionista #manicure`…) e alcance
  (`#agendamentoonline #pequenosnegocios #donodenegocio`…). Não repita o mesmo bloco em todo post.
- Nome de arquivo: `marcai-carrosselNN-slide-0X.svg`, continuando a numeração (o último antigo foi o 84).

## 7. Reels e anúncios

- Vertical **1080 × 1920**. Área segura de Reels: texto entre ~260 e ~1560 px de altura. Anúncio no Meta:
  texto e chamada entre x 65–1015 e y 270–1250.
- Mesmas cores, letra (Inter) e peças dos posts. Fundo claro ou escuro, nunca verde.
- Gravação de tela com o **app novo** (Grafite), dados fictícios.
- Movimento curto e sem quique (100–280 ms nas peças de interface, curva suave); nada piscando em laço.
- O projeto de vídeos (`marketing/videos/`, Remotion) ainda usa o visual antigo (Poppins, fundo verde).
  **Pendência:** migrar `src/theme.ts` e as peças para este guia antes do próximo Reel.

## 8. Dados de exemplo

Use só dados fictícios em print, mock e vídeo: Barbearia do Zeca, serviços Corte masculino / Barba / Corte + barba,
profissionais Zeca e Léo, cliente João Silva. Nunca nome, telefone ou e-mail de cliente ou dono reais.
Preços e planos sempre os do site: Freemium R$ 0 (até 5 agendamentos por mês), Básico R$ 49, Pro R$ 99, Prime R$ 299.

## 9. Tom de voz

**Direto, confiante, brasileiro, sem corporativês.** Soa como um fundador jovem que respeita o tempo do dono do negócio.

| Usar | Evitar |
| --- | --- |
| "Agendamentos simples. Clientes felizes." | "Solução omnichannel para gestão de scheduling" |
| "Seu cliente agenda. Você recebe no WhatsApp." | "Plataforma integrada de comunicação" |
| "Grátis pra começar. Sem cartão." | "Experimente nossa versão freemium sem compromisso" |
| "Sem app. Sem complicação." | "Interface intuitiva e user-friendly" |

- Título diz o que a tela ou o post responde. Botão é verbo + objeto ("Criar meu link", "Ver horários").
- Sem promessa exagerada, sem número inventado, sem depoimento inventado.

## 10. Checklist antes de publicar

- [ ] Fundo claro (`#F0F0F3`) ou escuro (`#141416`). Nenhum fundo verde, nenhum gradiente.
- [ ] Verde só em uma palavra **ou** no dado, nunca espalhado.
- [ ] Inter, título em semibold (600) com espaçamento −0,03em. Nada de 800.
- [ ] Um botão preto só, no slide da chamada.
- [ ] Logo oficial, com o "í", sem fundo verde, com respiro.
- [ ] Prints com o app novo e dados fictícios.
- [ ] Slide 3 fecha com `marcai.net.br` e `@usemarcai`.
- [ ] Texto a mais de 72 px da borda; 1080 × 1350.
- [ ] Copy no tom certo; depoimento com "EXEMPLO"; dado verificável.
- [ ] Exportado e conferido no celular antes de postar.
