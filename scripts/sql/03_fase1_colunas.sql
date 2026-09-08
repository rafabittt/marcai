-- ─────────────────────────────────────────────────────────────────────────────
-- FASE 1 — DDL aditivo. Nenhuma coluna é NOT NULL, nenhuma linha é reescrita
-- (fora o default de `tipo`, explicado abaixo), então nada do que existe hoje
-- quebra: o código atual ignora as colunas novas até a Etapa 4.
--
-- Rodar no SQL editor do Supabase. Depois disso vem a Etapa 2 (campo de preço
-- na tela de serviços) e a Etapa 3 (backfill com preview).
--
-- ── O que cada coluna é ──────────────────────────────────────────────────────
--
-- servicos.preco
--   Preço de tabela do serviço, o que o dono edita. Pode mudar com reajuste.
--   numeric(10,2) e não float: dinheiro em ponto flutuante acumula erro de
--   centavo. Fica nullable — serviço sem preço cadastrado é estado legítimo,
--   e "0,00" mentiria dizendo que é de graça.
--
-- agendamentos.preco
--   O preço CONGELADO no ato do agendamento. Existe separado de servicos.preco
--   justamente para o histórico não mudar quando o dono reajusta a tabela: sem
--   esta coluna, o faturamento de meses passados seria recalculado a cada
--   reajuste. Nullable porque os agendamentos que já existem não têm preço.
--
-- agendamentos.duracao_min
--   Duração em minutos, gravada como número. Hoje a duração é extraída por
--   regex do TEXTO do serviço ('Corte (30 min)') — e 6 dos 20 agendamentos em
--   produção não têm parênteses, caindo silenciosamente em 30 min. Com uma
--   coluna, a duração passa a ser um dado, não uma inferência.
--
-- agendamentos.profissional_id
--   FK para profissionais. Hoje o vínculo é a coluna `profissional`, TEXTO com
--   o nome — então renomear um profissional órfã o histórico dele, e dois
--   profissionais de mesmo nome colidem. A coluna de texto NÃO é removida
--   agora: ela continua sendo o nome exibido, inclusive para profissionais que
--   já foram apagados.
--
--   ON DELETE SET NULL de propósito. Sem cláusula o padrão seria NO ACTION, e
--   depois do backfill apagar um profissional com histórico passaria a falhar
--   por violação de FK — em silêncio, porque o botão "Remover" em
--   /profissionais não checa o erro. Com SET NULL, apagar zera o id e o nome
--   continua no histórico pela coluna de texto.
--
-- agendamentos.observacoes
--   Texto livre do dono sobre o atendimento. Usado pelo painel lateral.
--
-- agendamentos.tipo
--   'agendamento' | 'bloqueio'. Bloqueio é o dono fechando um horário sem que
--   haja cliente — é o que permite os dois DROP NOT NULL abaixo.
--
--   ATENÇÃO, isto NÃO é silencioso: em Postgres 11+, `add column ... default`
--   preenche as linhas existentes. Todos os 20 agendamentos atuais passam a
--   ter tipo='agendamento', que é o valor correto para eles — nenhum é
--   bloqueio. É o único efeito deste arquivo sobre dados existentes.
--
-- cliente_nome / cliente_telefone: DROP NOT NULL
--   Um bloqueio não tem cliente. Sozinho isso abriria espaço para agendamento
--   comum sem nome, então o CHECK logo abaixo fecha de volta: só bloqueio pode
--   ficar sem cliente.
-- ─────────────────────────────────────────────────────────────────────────────

alter table servicos      add column preco numeric(10,2);

alter table agendamentos  add column preco numeric(10,2);
alter table agendamentos  add column duracao_min int;
alter table agendamentos  add column profissional_id uuid
                            references profissionais(id) on delete set null;
alter table agendamentos  add column observacoes text;
alter table agendamentos  add column tipo text default 'agendamento';

alter table agendamentos  alter column cliente_nome     drop not null;
alter table agendamentos  alter column cliente_telefone drop not null;

-- Devolve ao banco a garantia que o DROP NOT NULL tirou: agendamento de
-- verdade continua exigindo cliente; só bloqueio pode ficar sem.
alter table agendamentos  add constraint agendamentos_cliente_obrigatorio
                            check (tipo = 'bloqueio' or cliente_nome is not null);


-- ── Verificação, depois de rodar ─────────────────────────────────────────────
-- select column_name, data_type, is_nullable, column_default
--   from information_schema.columns
--  where table_name in ('agendamentos','servicos')
--    and column_name in ('preco','duracao_min','profissional_id','observacoes',
--                        'tipo','cliente_nome','cliente_telefone')
--  order by table_name, column_name;
--
-- select tipo, count(*) from agendamentos group by tipo;   -- 20 'agendamento'
--
-- select confdeltype from pg_constraint
--  where conname = 'agendamentos_profissional_id_fkey';     -- 'n' = set null
--
-- select conname from pg_constraint
--  where conname = 'agendamentos_cliente_obrigatorio';      -- 1 linha
