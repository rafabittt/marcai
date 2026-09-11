# Marcaí — Roadmap

Fases do produto e o que já foi feito. Atualize o status conforme avança.

## Feito ✅

- **Segurança / correções**
  - Vazamento de PII fechado — `negocios` sem acesso anon, leitura pública pela view
    `negocios_publico` (SQL `01`/`02`). CPF/telefone não vazam mais.
  - `/api/agendar` com service role — double-booking (409) e limite de plano (403) que
    estavam inertes voltaram a funcionar.
  - Interna passou a usar `/api/agendar` (antes fazia insert direto sem validação).
  - Validação de expediente no servidor (422).

- **Base de UX (Fase A)** — Poppins de verdade (o app rodava em Arial), `lang=pt-BR`, remoção
  do dark mode parcial, extração de `lib/agenda.ts` e dos componentes `StatusBadge`/
  `MetricCard`/`InfoRow`. Harness de teste (`npm test` / `npm run test:fusos`).

- **Configurações de agenda (Fase B)** — intervalos/almoço (blocos), buffer entre
  atendimentos, folgas por data; tudo respeitado na geração de horários e validado na API.
  Limpeza do resíduo de chaves curtas (`seg`..`dom`).

- **UI nova de agendamento** — fluxo em passos, botões de horário Manhã/Tarde/Noite no design
  do site (fim do seletor nativo), resumo lateral, componentes compartilhados pública/interna.
  É a única (flag removida).

- **Dashboard reestruturado** — Resumo do dia (tiles), Próximos (5), Histórico em aba
  paginada (gráfico antes da lista), `PainelLateral` slide-over.

- **Mensagem de confirmação editável** — dois templates (cliente/dono) com variáveis e
  preview, no JSONB de config; view ajustada pra não vazar (SQL `05`).

- **Fase 1 (schema base)** — colunas `preco` (serviço e agendamento), `duracao_min`,
  `profissional_id` (FK), `observacoes`, `tipo` em `agendamentos` (SQL `03`). Campo de preço
  no cadastro de serviços.

- **Webhook do Asaas** — 9 eventos tratados, plano sincronizado.

## Em andamento 🔧

- **Fase 1.5 — serviço ↔ profissional (M2M).** Junção `servico_profissional` (SQL `04`,
  aditivo, com RLS). Falta: backfill dos vínculos (Etapa B, script com preview), seção
  `/servicos` como catálogo com multi-select de profissionais (Etapa C), e o fluxo de
  agendamento passar a Serviço → Profissional → Data → Horário (Etapa D).

## Próximo 📋

- **Backfill dos agendamentos** — `profissional_id` a partir do nome (6 ficam null, decidir),
  `duracao_min` a partir do texto (6 sem duração, preencher à mão), e `agendamentos.preco`
  dos passados (deixar null e contar daqui pra frente, ou estimar pelo preço atual — decidir).
- **Ligar o preço no fluxo** — preço nos cards de serviço e no resumo do agendamento; congelar
  no ato; usar `duracao_min` no lugar do regex.
- **Aba Desempenho (mini-CRM)** — faturamento (semana/mês, vs período anterior), ticket médio,
  taxa de no-show, gráfico faturamento+agendamentos, serviços que mais faturam, profissional
  destaque, clientes que voltam (por telefone). Depende do preço.
- **Bloquear horário** — usar `tipo='bloqueio'` (a query do limite do plano já deve filtrar
  `tipo='agendamento'`).
- **Login com Google** — Supabase Auth; dono por padrão, cliente opcional por negócio
  (`exigir_cadastro_cliente`), desligado por padrão.
- **Agenda visual do dono** — colunas por profissional, blocos por status, arrastar pra
  remarcar (por último, maior risco), painel lateral de criar/editar.

## Referências de UX

Padrões pesquisados no Mobbin (Fresha, Square, Acuity, Wix, GoDaddy, Calendly/Clockwise,
Trinks) para dashboard, fluxo de agendamento e catálogo de serviços. Ao construir uma tela
nova, vale puxar o exemplo equivalente pra apontar o layout desejado.
