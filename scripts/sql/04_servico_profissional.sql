-- ─────────────────────────────────────────────────────────────────────────────
-- FASE 1.5, ETAPA A — tabela de junção servico ↔ profissional.
--
-- Hoje `servicos.profissional_id` amarra um serviço a UM profissional. Isso
-- não descreve o negócio: "Corte Masc" é catálogo, e numa barbearia com três
-- barbeiros os três fazem o mesmo corte. Com o modelo atual seria preciso
-- cadastrar "Corte Masc" três vezes, uma por profissional — três preços para
-- manter, três durações, e três serviços diferentes na tela do cliente para o
-- que é um só. É como Fresha, GoDaddy e Square modelam: o serviço é a entidade
-- do catálogo e a equipe é uma atribuição sobre ela.
--
-- Este arquivo é ADITIVO. `servicos.profissional_id` NÃO é removida: ela vira
-- legado e continua sendo a fonte de verdade até a Etapa B migrar os vínculos
-- e o código passar a ler a junção. Remover a coluna é um passo separado, e
-- depois disso.
--
-- Rodar no SQL editor do Supabase.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.servico_profissional (
  servico_id      uuid not null references public.servicos(id)      on delete cascade,
  profissional_id uuid not null references public.profissionais(id) on delete cascade,
  created_at      timestamptz not null default now(),

  -- Chave primária composta. Atende o unique(servico_id, profissional_id)
  -- pedido e vai além: garante NOT NULL nas duas pontas e já cria o índice
  -- por servico_id, que é como a tela de agendamento vai consultar
  -- ("quem faz este serviço?"). Numa tabela de junção pura não há o que
  -- referenciar de fora, então uma coluna id extra só ocuparia espaço.
  primary key (servico_id, profissional_id)
);

-- O índice do PK cobre servico_id (é o prefixo). A consulta inversa —
-- "que serviços este profissional faz?", usada na tela de equipe — precisa
-- deste aqui, senão vira varredura.
create index if not exists servico_profissional_profissional_id_idx
  on public.servico_profissional (profissional_id);

comment on table public.servico_profissional is
  'Quais profissionais executam cada serviço. Substitui servicos.profissional_id, '
  'que fica como legado até o código migrar para cá.';

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- Espelha o comportamento verificado nas tabelas irmãs: o role anon LÊ
-- servicos e profissionais (a página pública de agendamento depende disso) e
-- NÃO escreve (INSERT anon é negado com 42501 nas duas).
--
-- Sem RLS habilitada, esta tabela nasceria aberta para escrita anônima —
-- qualquer pessoa com a anon key, que é pública por definição, poderia
-- atribuir serviços a profissionais de qualquer negócio.

alter table public.servico_profissional enable row level security;

-- Leitura liberada: a página /agendar/[slug] precisa saber quem faz cada
-- serviço para filtrar os profissionais. Não há dado sensível aqui — são dois
-- ids que já são públicos por servicos e profissionais.
create policy "servico_profissional_leitura_publica"
  on public.servico_profissional
  for select
  using (true);

-- Escrita só do dono do negócio a que o serviço pertence. A junção não tem
-- negocio_id, então a checagem sobe por servicos -> negocios.user_id.
create policy "servico_profissional_dono_insere"
  on public.servico_profissional
  for insert to authenticated
  with check (
    exists (
      select 1
        from public.servicos s
        join public.negocios n on n.id = s.negocio_id
       where s.id = servico_profissional.servico_id
         and n.user_id = auth.uid()
    )
  );

create policy "servico_profissional_dono_apaga"
  on public.servico_profissional
  for delete to authenticated
  using (
    exists (
      select 1
        from public.servicos s
        join public.negocios n on n.id = s.negocio_id
       where s.id = servico_profissional.servico_id
         and n.user_id = auth.uid()
    )
  );

-- Não há policy de UPDATE de propósito: numa junção pura, "mudar" um vínculo
-- é apagar um par e inserir outro. Sem policy, UPDATE fica negado para todos
-- os roles não-privilegiados, que é o comportamento desejado.


-- ── Verificação, depois de rodar ─────────────────────────────────────────────
-- select column_name, data_type, is_nullable
--   from information_schema.columns
--  where table_name = 'servico_profissional' order by ordinal_position;
--
-- select conname, contype from pg_constraint
--  where conrelid = 'public.servico_profissional'::regclass;   -- p, f, f
--
-- select relrowsecurity from pg_class
--  where oid = 'public.servico_profissional'::regclass;        -- t
--
-- select policyname, cmd from pg_policies
--  where tablename = 'servico_profissional';                   -- 3 linhas
--
-- select count(*) from servico_profissional;                   -- 0, backfill e a Etapa B
