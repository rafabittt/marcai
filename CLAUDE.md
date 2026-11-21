# Marcaí

SaaS de agendamento via WhatsApp para pequenos negócios brasileiros (barbearia, salão,
clínica, estúdio de tattoo, nail designer, nutri, personal, estética). O dono cria um
**link único de agendamento**; o cliente agenda pelo celular **sem app e sem cadastro**;
a **confirmação cai no WhatsApp** dos dois automaticamente.

**Regra nº 1 do produto: o cliente agenda SEMPRE sem login.** É o principal diferencial.
Nada pode exigir conta, cadastro ou login antes de agendar, nem como opção do negócio
(ver `DECISOES.md` item 14).

**O dono do negócio é o cliente pagante — a UX dele vem primeiro.** O cliente final
não paga e não deve ter atrito (nada de obrigar cadastro/app).

## Documentos de referência (leia antes de perguntar)

- `DECISOES.md` — decisões de produto e arquitetura, com o porquê. **A fonte da verdade
  de "por que está assim".**
- `GUIA-DEPLOY.md` — como publicar, rodar SQL, mexer em env var, e o troubleshooting dos
  problemas que já aconteceram.
- `ROADMAP.md` — as fases do produto e o que já foi feito.

## Stack

- **Next.js 16.1.6 (App Router) + TypeScript + Tailwind.** Roda em **webpack, não
  Turbopack** (ver regra crítica abaixo).
- **Supabase** — Postgres + Auth + RLS. Duas chaves: `anon` (pública, vai pro browser) e
  `service_role` (só servidor, ignora RLS).
- **Z-API** — envio de WhatsApp (`send-text`). Não tem editor de mensagem; só entrega o
  texto que a gente monta.
- **Asaas** — cobrança por assinatura recorrente + webhook.
- **Vercel** — produção, deploy automático no push pra `main`. Domínio `marcai.net.br`.
- Repo: `github.com/rafabittt/marcai`. Local: `~/projects/apps/marcai` (fora do iCloud — nunca de volta
  pra Documents/Desktop, o iCloud corrompe `.next`/`node_modules`).
- **`marketing/videos/`** — projeto **Remotion** separado (Reels da marca), com o próprio
  `package.json`. **Não faz parte do app:** está excluído do `tsconfig`, do eslint e do
  git (`node_modules/` e `out/` com os MP4). Não importe nada dele no app nem vice-versa.
  Rodar: `cd marketing/videos && npm install && npm run studio`. **Ainda está no visual
  antigo** (Poppins, fundo verde): migrar para o `marketing/BRAND-GUIDE.md` antes do próximo Reel.

## Regras críticas (violar isso quebra em produção, às vezes em silêncio)

1. **Comando de dev: `npm run dev`** (que é `next dev --webpack`). NUNCA rode sem
   `--webpack`: o Turbopack do Next 16 não reconhece as rotas de API. O script já tem a
   flag — não use `npx next dev` cru.

2. **Convenção naive-UTC (`lib/agenda.ts`).** Toda aritmética de data/hora usa
   `getUTCHours`/`getUTCDate`/etc. Usar `getHours()` desloca tudo em 3h (fuso de SP) e o
   bug só aparece pra quem confere o horário. É o risco técnico nº 1 da agenda. O harness
   (`npm run test:fusos`) roda em UTC/São Paulo/Tóquio justamente pra pegar isso.

3. **Segurança de dados é levada a sério — já tivemos vazamento de PII.**
   - A tabela `negocios` **não é legível por anon**. A página pública lê a **view
     `negocios_publico`** (só colunas seguras: `id, nome, slug, endereco, horarios`).
     CPF e telefone do dono NUNCA saem em resposta pública.
   - `/api/agendar` roda com **service role**, não anon. Motivo: com anon, a RLS escondia
     `agendamentos` e as checagens de double-booking (409) e limite de plano (403) voltavam
     `count=0` — passavam batido. Service role corrige.
   - Toda tabela nova nasce com **RLS habilitada**. Junção (`servico_profissional`): leitura
     pública dos ids, escrita só do dono, checada por `servicos → negocios.user_id`.
   - Templates de mensagem moram no `negocios.horarios` (JSONB) e são **removidos da view**
     pública pra não vazar.

4. **DDL é do Rafa, backfill é seu.** Você **não tem** `psql`/`DATABASE_URL` — não roda
   `ALTER TABLE`. Prepare o SQL comentado em `scripts/sql/NN_*.sql` pra ele rodar no editor
   do Supabase. Alterações de **dados** (backfill) você faz por script com **preview
   antes/depois** e espera o **OK** antes de gravar. Nunca grave em produção por conta
   própria.

5. **Sem default silencioso.** Se um dado está faltando (ex.: serviço sem duração, sem
   profissional), **liste pro Rafa decidir** — não chute 30 min nem null calado.

6. **Preço é congelado no agendamento.** `agendamentos.preco` guarda o valor no ato; nunca
   leia de `servicos.preco` na hora de mostrar histórico — reajuste não pode mudar o
   passado.

## Como trabalhar aqui

- **Incremental, um passo por vez.** Diga em poucas linhas o que vai fazer e quais arquivos
  vai tocar. Mostre **diffs antes de qualquer push**.
- **Não pushe sem o OK do Rafa.** Push dispara deploy em produção.
- **Rode as verificações a cada passo:** `tsc --noEmit`, eslint nos arquivos tocados,
  `npm run build`, e o harness `npm test` / `npm run test:fusos` (tem que ficar verde).
- **Reaproveite os componentes compartilhados** em vez de duplicar. Pública e interna de
  agendamento compartilham `app/components/agendamento/*`. Duplicação já custou bug em
  produção.
- **Valide layout no olho, não só nos testes.** Testes cobrem lógica e dados, não pegam UI
  torta. Telas com login o Rafa valida logando ele mesmo.
- **Design: Grafite** (o design de todos os apps do Rafa, em `~/projects/design/grafite/`;
  use o skill `grafite-design`). Fundo cinza `#F0F0F3`, cartões brancos, fonte do sistema
  (**nunca Poppins/Inter no app**), botão principal preto em pílula (um por tela), e o
  **verde Marcaí `#25D366` como única cor viva**, só onde há informação (confirmado, check,
  barra, foco, mancha do cartão principal). Texto verde é `--accent-ink` (`#167E3D`), porque o
  `#25D366` puro não passa no contraste. `no_show` ("Faltou") é o vermelho de erro (`--bad`).
  Claro e escuro saem das mesmas variáveis.
  - **Nenhuma cor escrita direto em componente:** use as classes que saem dos tokens de
    `app/globals.css` (`bg-surface`, `text-muted`, `border-hairline`, `text-accent-ink`...) e as
    peças prontas (`.card`, `.btn`, `.btn-primary`, `.field`, `.badge`, `.list-row`, `.t-title`...).
    Nada de `bg-white`, `text-gray-*`, hex ou `font-bold`.
  - Peças compartilhadas: `Abas` (abas em pílula), `MetricCard`, `StatusBadge`, `InfoRow`,
    `PainelLateral`, `Carregando`, `SidebarLayout`/`Sidebar` (barra lateral escura flutuante).
  - Guia da marca (site, posts, Reels, anúncios): `marketing/BRAND-GUIDE.md`; modelos de post
    em `marketing/modelos/`.
- **Tom das mensagens/cópia:** direto, confiante, brasileiro, sem corporativês.

## Estrutura de dados (resumo)

- `negocios` — `id, user_id, nome, slug, endereco, cpf, telefone, plano, asaas_customer_id,
  horarios (jsonb)`. O `horarios` guarda a agenda (chaves longas
  `segunda`..`domingo`, `buffer_min`, `folgas[]`) **e** os templates
  `msg_confirmacao_cliente`/`msg_confirmacao_dono`. Cada dia é um objeto
  `{abertura, fechamento, fechado, aberto24h, intervalos:[{inicio,fim}]}` — ver
  `DECISOES.md` item 5 para o formato e as regras de leitura.
- `servicos` — `id, negocio_id, nome, duracao, preco`. (`profissional_id` é **legado**,
  sendo substituído pela junção.)
- `profissionais` — `id, negocio_id, nome, cargo, foto_url`.
- `servico_profissional` — junção M2M (`servico_id, profissional_id`). Quem faz cada serviço.
- `agendamentos` — `id, negocio_id, cliente_nome, cliente_telefone, servico, profissional
  (texto, legado), profissional_id (FK, ON DELETE SET NULL), data_hora, status, preco,
  duracao_min, observacoes, tipo ('agendamento'|'bloqueio')`.

## Planos e cobrança

Freemium R$0 (até 5 agendamentos/mês), Básico R$49, Pro R$99, Prime R$299. A query do limite
do plano free **filtra `tipo='agendamento'`** (bloqueio de horário não consome cota). O
webhook do Asaas (`/api/webhooks/asaas`) mantém `negocios.plano` sincronizado e valida o
header `asaas-access-token` contra `ASAAS_WEBHOOK_TOKEN`; responde 200 pra qualquer evento
(401 só pra token inválido).
