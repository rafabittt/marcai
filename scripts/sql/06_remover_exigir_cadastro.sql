-- ─────────────────────────────────────────────────────────────────────────────
-- Remove a opção "Exigir cadastro do cliente" (coluna exigir_cadastro_cliente).
--
-- Decisão de 20/11/2026 (DECISOES.md item 14): o cliente agenda SEMPRE sem
-- conta e sem login. O negócio não tem mais como exigir cadastro. O código já
-- não lê nem grava essa coluna; este arquivo só limpa o banco.
--
-- ⚠️ ORDEM: rode SÓ DEPOIS que o deploy com a remoção estiver no ar
--    (marcai.net.br sem o interruptor em Configurações). A versão antiga do
--    site lê essa coluna: se o banco perder a coluna antes, a página pública
--    de agendamento dá "não encontrado" e Configurações não carrega.
--
-- Por que DROP VIEW e não CREATE OR REPLACE: o REPLACE não deixa tirar coluna.
-- Ao recriar a view, a permissão de leitura do anon some junto, por isso o
-- GRANT no fim (mesmo do arquivo 01). Tudo numa transação: se algo falhar,
-- nada muda.
--
-- Rodar no SQL editor do Supabase.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

drop view public.negocios_publico;

create view public.negocios_publico as
select
  id,                        -- necessário: /api/agendar/ocupados?negocio_id=
  nome,                      -- exibido no cabeçalho
  slug,                      -- usado no POST /api/agendar
  endereco,                  -- exibido abaixo do nome
  -- Configuração de agenda, SEM os templates de mensagem. Ao adicionar
  -- qualquer chave privada nova neste JSONB, lembre de removê-la aqui também.
  (horarios - 'msg_confirmacao_cliente' - 'msg_confirmacao_dono') as horarios
from public.negocios;

comment on view public.negocios_publico is
  'Projeção pública de negocios para /agendar/[slug]. Existe porque RLS é por '
  'linha e não por coluna: esconder cpf/telefone do anon exige uma view. '
  'O JSONB horarios sai sem os templates de mensagem, que são configuração '
  'interna e só o servidor usa. NÃO adicione colunas nem chaves aqui sem '
  'revisar o que passa a vazar. Deliberadamente sem security_invoker — o anon '
  'não tem acesso à tabela base.';

grant select on public.negocios_publico to anon, authenticated;

alter table public.negocios drop column exigir_cadastro_cliente;

commit;


-- ── Verificação, depois de rodar ─────────────────────────────────────────────
--
-- 1. A view tem 5 colunas: id, nome, slug, endereco, horarios.
--
-- select ordinal_position, column_name
--   from information_schema.columns
--  where table_name = 'negocios_publico'
--  order by ordinal_position;
--
-- 2. A coluna sumiu da tabela (deve voltar 0 linhas):
--
-- select column_name from information_schema.columns
--  where table_name = 'negocios' and column_name = 'exigir_cadastro_cliente';
--
-- 3. Abra o link público de um negócio (marcai.net.br/agendar/<slug>) numa
--    janela anônima: tem que abrir direto no agendamento, sem pedir login.
