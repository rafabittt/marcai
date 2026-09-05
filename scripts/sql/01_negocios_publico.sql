-- ─────────────────────────────────────────────────────────────────────────────
-- CORREÇÃO DE PII — passo 1 de 2 (aditivo, não quebra nada)
--
-- Problema: a página pública /agendar/[slug] precisa ler dados do negócio sem
-- login. Hoje isso é feito lendo a tabela `negocios` direto com a anon key, e
-- a anon key é pública (vai no bundle do browser, NEXT_PUBLIC_*). Resultado:
-- qualquer pessoa conseguia
--     GET /rest/v1/negocios?select=cpf,telefone
-- e receber o CPF e o telefone de todos os donos.
--
-- Por que uma VIEW e não uma policy: RLS filtra LINHAS, não COLUNAS. Não existe
-- policy que esconda `cpf` mantendo `nome` legível na mesma tabela. O mecanismo
-- correto é expor uma projeção com apenas as colunas seguras.
--
-- Esta view roda com as permissões do dono (comportamento padrão — NÃO defina
-- security_invoker), que é justamente o que permite ao anon lê-la depois que o
-- acesso à tabela base for revogado no passo 2.
--
-- Sobre linhas: a view expõe todos os negócios, igual a hoje — a página pública
-- precisa achar qualquer slug. A mudança é de COLUNAS, não de linhas.
--
-- ORDEM DE EXECUÇÃO: rode este arquivo ANTES do deploy do código novo.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace view public.negocios_publico as
select
  id,                        -- necessário: /api/agendar/ocupados?negocio_id=
  nome,                      -- exibido no cabeçalho
  slug,                      -- usado no POST /api/agendar
  endereco,                  -- exibido abaixo do nome
  horarios,                  -- grade de horários e dias fechados
  exigir_cadastro_cliente    -- decide se mostra o gate de login
from public.negocios;

comment on view public.negocios_publico is
  'Projeção pública de negocios para /agendar/[slug]. Existe porque RLS é por '
  'linha e não por coluna: esconder cpf/telefone do anon exige uma view. '
  'NÃO adicione colunas aqui sem revisar o que passa a vazar. '
  'Deliberadamente sem security_invoker — o anon não tem acesso à tabela base.';

grant select on public.negocios_publico to anon, authenticated;
