-- ─────────────────────────────────────────────────────────────────────────────
-- Tira os templates de mensagem da view pública.
--
-- Os templates de confirmação do WhatsApp (msg_confirmacao_cliente e
-- msg_confirmacao_dono) moram no JSONB `horarios`, junto de buffer_min e
-- folgas — foi a forma de adicioná-los sem migração de tabela. O efeito
-- colateral é que a view negocios_publico expõe `horarios` inteiro ao role
-- anon, então qualquer pessoa com a anon key (pública por definição, ela vai
-- no bundle do browser) conseguiria:
--
--   GET /rest/v1/negocios_publico?select=horarios
--
-- e ler os dois textos, inclusive o aviso interno que o dono recebe. Não é PII
-- como o CPF que o arquivo 02 fechou, mas é configuração interna vazando.
--
-- A correção é remover as duas chaves na projeção da view. O operador `-` do
-- jsonb devolve o objeto sem a chave indicada; encadeado, tira as duas. Se
-- `horarios` for NULL, o resultado segue NULL, igual a antes.
--
-- POR QUE NÃO QUEBRA NADA
--   A view é lida em um único lugar: /api/negocio/[slug], que serve a página
--   pública de agendamento. Essa página usa `horarios` apenas para a grade de
--   horários — horariosDoDia, getConfDia, getBuffer e getFolgas. Nenhum deles
--   olha as chaves msg_*.
--
--   Quem lê os templates são dois caminhos que NÃO passam por esta view:
--     - /api/agendar, no servidor, com service role, lendo a tabela base;
--     - /configuracoes, autenticado, lendo a tabela base para o editor.
--   Os dois seguem enxergando as chaves normalmente.
--
-- SOBRE O CREATE OR REPLACE
--   Mantém as 6 colunas atuais, com os mesmos nomes, tipos e ordem — que é o
--   que o REPLACE exige. Só a expressão de `horarios` muda, e ela continua
--   jsonb. Substituir uma view preserva dono e permissões, então o
--   `grant select ... to anon, authenticated` do arquivo 01 continua valendo:
--   não é preciso reconceder nada.
--
-- Rodar no SQL editor do Supabase.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace view public.negocios_publico as
select
  id,                        -- necessário: /api/agendar/ocupados?negocio_id=
  nome,                      -- exibido no cabeçalho
  slug,                      -- usado no POST /api/agendar
  endereco,                  -- exibido abaixo do nome
  -- Configuração de agenda, SEM os templates de mensagem. Ao adicionar
  -- qualquer chave privada nova neste JSONB, lembre de removê-la aqui também.
  (horarios - 'msg_confirmacao_cliente' - 'msg_confirmacao_dono') as horarios,
  exigir_cadastro_cliente    -- decide se mostra o gate de login
from public.negocios;

comment on view public.negocios_publico is
  'Projeção pública de negocios para /agendar/[slug]. Existe porque RLS é por '
  'linha e não por coluna: esconder cpf/telefone do anon exige uma view. '
  'O JSONB horarios sai sem os templates de mensagem, que são configuração '
  'interna e só o servidor usa. NÃO adicione colunas nem chaves aqui sem '
  'revisar o que passa a vazar. Deliberadamente sem security_invoker — o anon '
  'não tem acesso à tabela base.';


-- ── Verificação, depois de rodar ─────────────────────────────────────────────
--
-- 1. As 6 colunas continuam as mesmas, na mesma ordem:
--
-- select ordinal_position, column_name, data_type
--   from information_schema.columns
--  where table_name = 'negocios_publico'
--  order by ordinal_position;
--    -- 1 id uuid | 2 nome text | 3 slug text | 4 endereco jsonb
--    -- 5 horarios jsonb | 6 exigir_cadastro_cliente boolean
--
-- 2. As chaves msg_* somem da view, mesmo quando existem na tabela base.
--    `?` testa a presença de uma chave no jsonb. As duas colunas da view
--    precisam vir FALSE em todas as linhas, independente do que a base tenha:
--
-- select n.slug,
--        n.horarios ? 'msg_confirmacao_cliente' as base_tem_msg_cliente,
--        v.horarios ? 'msg_confirmacao_cliente' as view_tem_msg_cliente,
--        n.horarios ? 'msg_confirmacao_dono'    as base_tem_msg_dono,
--        v.horarios ? 'msg_confirmacao_dono'    as view_tem_msg_dono
--   from public.negocios n
--   join public.negocios_publico v on v.id = n.id
--  order by n.slug;
--
--    Para testar de verdade, grave um template antes de rodar a query — se
--    nenhum negócio tiver as chaves, as quatro colunas dão false e o teste não
--    prova nada. Editar em /configuracoes serve, ou:
--
--    update public.negocios
--       set horarios = horarios || '{"msg_confirmacao_dono":"teste"}'::jsonb
--     where slug = 'teste';
--    -- rode a query acima: base_tem_msg_dono = true, view_tem_msg_dono = false
--    update public.negocios
--       set horarios = horarios - 'msg_confirmacao_dono'
--     where slug = 'teste';   -- desfaz
--
-- 3. Nada mais foi perdido do JSONB — a view tem exatamente as chaves da base
--    menos as de mensagem:
--
-- select n.slug,
--        (select count(*) from jsonb_object_keys(n.horarios)) as chaves_base,
--        (select count(*) from jsonb_object_keys(v.horarios)) as chaves_view
--   from public.negocios n
--   join public.negocios_publico v on v.id = n.id
--  order by n.slug;
--
-- 4. O anon continua lendo a view (a página pública precisa disso):
--
-- select count(*) from public.negocios_publico;   -- 2
