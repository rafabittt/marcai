# Marcaí

SaaS de agendamento via WhatsApp para pequenos negócios brasileiros (barbearia, salão,
clínica, estúdio de tattoo, nail designer, nutri, personal, estética). O dono cria um
**link único de agendamento**; o cliente agenda pelo celular **sem app e sem cadastro**;
a **confirmação cai no WhatsApp** dos dois automaticamente.

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
- Repo: `github.com/rafabittt/marcai`. Local: `~/marcai` (fora do iCloud — nunca de volta
  pra Documents/Desktop, o iCloud corrompe `.next`/`node_modules`).

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
     `negocios_publico`** (só colunas seguras: `id, nome, slug, endereco, horarios,
     exigir_cadastro_cliente`). CPF e telefone do dono NUNCA saem em resposta pública.
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
- **Marca:** verde Marcaí `#25D366`, verde escuro `#128C7E`, preto editorial `#0a0a0a`,
  fonte Poppins, cantos arredondados, limpo. `no_show` é sempre `#ef4444`. (Guia completo de
  posts em `marcai-guideline-posts-instagram.md`, se estiver na pasta de assets.)
- **Tom das mensagens/cópia:** direto, confiante, brasileiro, sem corporativês.

## Estrutura de dados (resumo)

- `negocios` — `id, user_id, nome, slug, endereco, cpf, telefone, plano, asaas_customer_id,
  exigir_cadastro_cliente, horarios (jsonb)`. O `horarios` guarda a agenda (chaves longas
  `segunda`..`domingo` como blocos `[{inicio,fim}]`, `buffer_min`, `folgas[]`) **e** os
  templates `msg_confirmacao_cliente`/`msg_confirmacao_dono`. Dia sem blocos = fechado.
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
