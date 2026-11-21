-- ─────────────────────────────────────────────────────────────────────────────
-- Fecha três brechas apontadas pelo Security Advisor do Supabase (20/11/2026).
--
-- 1) QUALQUER USUÁRIO LOGADO LIA TODOS OS NEGÓCIOS (CPF, telefone, ids do Asaas,
--    textos das mensagens). O arquivo 02 tirou a leitura do `anon`, mas a
--    política "público pode ver negocios" (SELECT, USING true, para todos os
--    papéis) continuou valendo para o papel `authenticated`. Como qualquer um
--    cria conta de cliente de graça em /cliente/cadastro, bastava logar e ler
--    /rest/v1/negocios?select=* para ver os dados de todos os donos.
--    Depois desta correção, o dono só lê o próprio negócio ("dono vê seu
--    negócio"), e o público continua lendo só a view negocios_publico.
--    O único código que lia negócio alheio (checar se o link está livre, em
--    /configuracoes) passou a ler a view no mesmo deploy.
--
-- 2) QUALQUER PESSOA PODIA GRAVAR AGENDAMENTO DIRETO NO BANCO, pulando o
--    /api/agendar (sem checar horário ocupado, expediente, limite do plano e
--    sem WhatsApp). O /api/agendar usa service role, que não depende dessa
--    política, então o agendamento sem login continua funcionando igual.
--
-- 3) A função rls_auto_enable() (SECURITY DEFINER) podia ser chamada pela API
--    por anon e logados. Ela só precisa rodar por dentro do banco.
--
-- ⚠️ ORDEM: rode DEPOIS do deploy que muda /configuracoes para ler a view.
--
-- Rodar no SQL editor do Supabase. Tudo numa transação.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

drop policy if exists "público pode ver negocios" on public.negocios;
drop policy if exists "leitura_publica_negocios" on public.negocios;

drop policy if exists "público pode inserir agendamentos" on public.agendamentos;

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

commit;


-- ── Verificação, depois de rodar ─────────────────────────────────────────────
--
-- 1. Políticas que sobram em negocios e agendamentos (só as do dono e do cliente):
--
-- select tablename, policyname, cmd from pg_policies
--  where schemaname = 'public' and tablename in ('negocios', 'agendamentos');
--
-- 2. Link público em janela anônima (marcai.net.br/agendar/<slug>): abre e
--    agenda normalmente, sem login.
--
-- 3. Em /configuracoes, trocar o link para um que já existe: aparece
--    "Esse link já está em uso".
