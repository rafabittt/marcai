# Marcaí — Decisões de produto e arquitetura

Registro do **porquê** das coisas, pro Claude Code não precisar perguntar de novo nem
reverter decisão por falta de contexto. Onde houver conflito com o código, o código vence
e este doc deve ser corrigido.

---

## 1. Convenção de horário: naive-UTC

Datas/horas são tratadas como "naive UTC" — os dígitos armazenados são o horário local
pretendido, e todo acesso usa `getUTC*`. Nunca `getHours()`/`getDate()`, que aplicam o fuso
da máquina e deslocam 3h em SP. Centralizado em `lib/agenda.ts`. O harness
(`npm run test:fusos`, roda em UTC/São Paulo/Tóquio) existe pra travar isso — mantenha verde.

## 2. Segurança: view pública em vez de RLS por coluna

RLS filtra linha, não coluna. Pra esconder CPF/telefone do dono sem quebrar a página
pública, `negocios` teve o acesso anon **revogado** e a leitura pública passou pela view
`negocios_publico` (só `id, nome, slug, endereco, horarios, exigir_cadastro_cliente`).
SQL: `scripts/sql/01`+`02`. Aprendizado: qualquer config nova no JSONB `horarios` que não
deva ser pública precisa ser removida da projeção da view (foi o caso dos templates de
mensagem, `scripts/sql/05`).

## 3. `/api/agendar` usa service role, não anon

Com a anon key, a RLS escondia `agendamentos` do papel anônimo e as checagens de
double-booking (`409`) e limite de plano (`403`) voltavam `count=0` — **passavam batido em
produção desde sempre**. Trocado pra service role, que enxerga os dados e faz as validações
de verdade. A interna (`/agendar-interno`) também passou a usar `/api/agendar` (antes fazia
`insert` direto do browser, sem validação nenhuma e notificando só o cliente).

## 4. Validação de expediente no servidor

Antes, só o dropdown do browser limitava horário — um POST direto marcava às 3h, no almoço
ou em dia fechado. `/api/agendar` agora revalida contra o expediente (`422`) além do
double-booking (`409`) e do limite de plano (`403`).

## 5. Config de agenda (JSONB)

`negocios.horarios` guarda **um objeto por dia**, nas chaves longas `segunda`..`domingo`:

```json
"terca": {
  "abertura": "08:00",
  "fechamento": "18:00",
  "fechado": false,
  "aberto24h": false,
  "intervalos": [{ "inicio": "12:00", "fim": "13:00" }]
}
```

- **O expediente é o par `abertura`/`fechamento`** — não um array de blocos.
- **As pausas (almoço, café) são explícitas em `intervalos`**, cada uma `{inicio, fim}`.
  O intervalo é semiaberto `[inicio, fim)`: 12:00 é bloqueado, 13:00 já atende.
- **`fechado: true` fecha o dia.** `ativo: false` também fecha — é resíduo da convenção
  antiga, que `getConfDia` ainda honra; código novo deve escrever `fechado`.
- **`aberto24h` é flag de UI.** Quem gera a grade só olha `abertura`/`fechamento`; a tela
  usa a flag para travar os selects e gravar 00:00–23:59.

Fora as chaves de dia, no mesmo objeto: `buffer_min` (minutos somados ao tempo reservado
de cada atendimento, para dar folga entre clientes) e `folgas[]` (datas `YYYY-MM-DD` em
que o negócio inteiro não atende, vencendo o expediente do dia).

**Dia sem configuração NÃO é fechado** — cai no fallback **08:00–18:00** (`horariosDoDia`).
E `horarios` nulo devolve a grade inteira, 08:00–20:00. Quem quiser fechar um dia precisa
dizer isso com `fechado: true`; a ausência da chave significa "não configurado", não
"fechado".

As chaves curtas antigas (`seg`..`dom`) eram resíduo divergente e foram migradas pras longas
(`segunda`..`domingo`) e removidas; o fallback pra chave curta em `getConfDia` foi removido.

## 6. Preço congelado no agendamento

`servicos.preco` é o preço de tabela (editável). `agendamentos.preco` é o valor **congelado
no ato**. Existem separados pra o faturamento histórico não mudar quando o dono reajusta a
tabela. `duracao_min` idem (antes a duração era regex no texto do serviço, com default
silencioso de 30 min pra serviço sem parênteses — bug).

## 7. Serviço ↔ profissional é muitos-para-muitos (Fase 1.5)

Um serviço é **catálogo**, oferecido por vários profissionais (como Fresha/GoDaddy/Trinks).
`servicos.profissional_id` (1:1) virou legado; a verdade passa pra a junção
`servico_profissional`. Catálogo mora numa seção `/servicos` própria (nome, duração, preço +
multi-select "quem faz este serviço"); `/profissionais` fica só com equipe. Booking:
Serviço → Profissional (quem faz) → Data → Horário. `ON DELETE CASCADE` na junção;
`ON DELETE SET NULL` em `agendamentos.profissional_id` (preserva o histórico pelo nome-texto).

## 8. UI nova de agendamento é a única

Trocou o seletor nativo (iOS) por botões no design do site, agrupados em Manhã/Tarde/Noite,
com resumo lateral. Construída como componentes compartilhados (`app/components/agendamento/`)
usados pela pública e pela interna. A feature flag de transição
(`NEXT_PUBLIC_AGENDAR_UI_NOVA`) e o override `?ui=nova/antiga` foram **removidos** — a nova é
a única. Cuidado: mexer no fluxo público mexe no funil de receita.

## 9. Mensagem de confirmação editável pelo dono

Dois templates por negócio (`msg_confirmacao_cliente`, `msg_confirmacao_dono`) no JSONB de
config, com defaults iguais ao texto que já era enviado (template igual ao default não é
gravado). Variáveis `{cliente} {telefone} {servico} {profissional} {data} {hora} {endereco}
{negocio}`; `[trecho opcional]` some quando a variável está vazia; nome desconhecido fica
literal + aviso. **O Z-API não tem nada a ver com isso** — só entrega o texto renderizado.
A lista de variáveis (não o objeto recebido) é a autoridade do que é "conhecido".

## 10. Webhook do Asaas trata 9 eventos

`PAYMENT_CONFIRMED`/`PAYMENT_RECEIVED` → ativa/renova plano (detecta pela descrição).
`PAYMENT_OVERDUE`/`PAYMENT_REFUNDED`/`PAYMENT_DELETED`/`SUBSCRIPTION_DELETED`/
`SUBSCRIPTION_INACTIVATED` → rebaixa pra gratuito. `SUBSCRIPTION_UPDATED` → detecta novo
plano. `SUBSCRIPTION_CREATED` → no-op (plano já setado no checkout). Valida o header
`asaas-access-token`; responde **200 pra qualquer evento** (senão o Asaas reenvia e pode
desativar o webhook), 401 só pra token inválido. Idempotente por construção
(`update ... where asaas_subscription_id = Y`). Ressalva conhecida: eventos fora de ordem
(um OVERDUE atrasado depois de um RECEIVED) podem rebaixar um adimplente — não tratado.

## 11. Dashboard: Hoje operacional + Desempenho (planejado)

Home reestruturada: "Resumo do dia" (tiles) + "Próximos" (só os 5) + aba "Histórico"
**paginada** (o histórico saiu da home pra ela parar de crescer sem fim). Modal central
virou `PainelLateral` (slide-over). Componentes reaproveitáveis: `StatusBadge` (cores por
status, `no_show` = `#ef4444`), `MetricCard`, `InfoRow`. A aba **Desempenho** (faturamento,
ticket médio, serviço que mais fatura, profissional destaque, clientes que voltam) depende
do preço e vem depois da migração. "Clientes que voltam" agrupa por **telefone** (nome tem
erro de digitação), funciona sem login.

## 12. Login com Google (planejado)

Supabase Auth nativo (`signInWithOAuth('google')` + rota `/auth/callback` com
`exchangeCodeForSession`), sem OAuth na mão. Login do DONO por padrão. Login do CLIENTE é
**opcional por negócio** (toggle `exigir_cadastro_cliente`) e **desligado por padrão** —
obrigar cadastro do cliente quebra o diferencial "sem app, sem cadastro". Nunca torne global.

---

*Decisões acumuladas ao longo do desenvolvimento. Atualize aqui sempre que uma escolha de
arquitetura for tomada ou revista.*
