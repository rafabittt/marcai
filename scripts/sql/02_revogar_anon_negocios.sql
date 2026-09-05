-- ─────────────────────────────────────────────────────────────────────────────
-- CORREÇÃO DE PII — passo 2 de 2 (fecha o vazamento)
--
-- ORDEM DE EXECUÇÃO: rode este arquivo SÓ DEPOIS de
--   1. ter rodado 01_negocios_publico.sql, e
--   2. ter feito deploy do código que lê negocios_publico / usa service role.
-- Rodar antes disso derruba a página pública de agendamento.
--
-- Afeta apenas o role `anon` (visitante sem login). O role `authenticated`
-- mantém o acesso, então dashboard, configurações, profissionais, perfil,
-- plano, Navbar e Sidebar continuam funcionando — todos leem `negocios` já
-- logados, e a RLS existente segue restringindo cada dono à sua própria linha.
-- O service_role ignora grants e RLS, então as rotas de servidor seguem OK.
-- ─────────────────────────────────────────────────────────────────────────────

revoke select on public.negocios from anon;

-- Verificação (deve devolver 0 linhas para o role anon):
--   set role anon;
--   select count(*) from public.negocios;   -- deve dar: permission denied
--   select count(*) from public.negocios_publico;  -- deve funcionar
--   reset role;
