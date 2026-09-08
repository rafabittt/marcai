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
--   Um bloqueio não tem cliente. Efeito colateral a registrar: depois disto o
--   banco passa a aceitar um agendamento comum sem nome. Ver a nota sobre o
--   CHECK no fim do arquivo.
-- ─────────────────────────────────────────────────────────────────────────────

alter table servicos      add column preco numeric(10,2);

alter table agendamentos  add column preco numeric(10,2);
alter table agendamentos  add column duracao_min int;
alter table agendamentos  add column profissional_id uuid references profissionais(id);
alter table agendamentos  add column observacoes text;
alter table agendamentos  add column tipo text default 'agendamento';

alter table agendamentos  alter column cliente_nome     drop not null;
alter table agendamentos  alter column cliente_telefone drop not null;


-- ── Verificação, depois de rodar ─────────────────────────────────────────────
-- select column_name, data_type, is_nullable, column_default
--   from information_schema.columns
--  where table_name in ('agendamentos','servicos')
--    and column_name in ('preco','duracao_min','profissional_id','observacoes',
--                        'tipo','cliente_nome','cliente_telefone')
--  order by table_name, column_name;
--
-- select tipo, count(*) from agendamentos group by tipo;   -- 20 'agendamento'


-- ─────────────────────────────────────────────────────────────────────────────
-- DUAS COISAS QUE NÃO ESTOU APLICANDO, e que valem decisão — ver a conversa.
--
-- 1. ON DELETE da FK. Sem cláusula, o padrão é NO ACTION: depois do backfill
--    da Etapa 3, apagar um profissional que tenha agendamentos passa a FALHAR
--    com violação de FK. O botão "Remover" em /profissionais não checa erro,
--    então falharia em silêncio. A alternativa é:
--
--      alter table agendamentos
--        drop constraint agendamentos_profissional_id_fkey,
--        add constraint agendamentos_profissional_id_fkey
--          foreign key (profissional_id) references profissionais(id)
--          on delete set null;
--
--    Com isso, apagar o profissional zera o id e o histórico preserva o nome
--    na coluna de texto `profissional`.
--
-- 2. CHECK protegendo o DROP NOT NULL, para agendamento comum continuar
--    exigindo cliente:
--
--      alter table agendamentos add constraint agendamentos_cliente_obrigatorio
--        check (tipo = 'bloqueio' or cliente_nome is not null);
-- ─────────────────────────────────────────────────────────────────────────────
