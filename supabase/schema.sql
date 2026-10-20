-- =====================================================================
-- Banco de dados do app de treinos (Supabase / PostgreSQL)
--
-- Como usar: no painel do Supabase, abra "SQL Editor", cole este arquivo
-- inteiro e clique em "Run". Pode rodar de novo sem problema.
--
-- Segurança: cada tabela tem Row Level Security (RLS). Cada pessoa só
-- consegue ler e alterar as próprias linhas (user_id = usuário logado).
--
-- Nada é apagado de verdade pelo app: quando algo é excluído, a linha
-- recebe deleted = true. Assim a exclusão chega a todos os aparelhos da
-- pessoa e, se preciso, dá para recuperar o dado.
-- =====================================================================

-- Atualiza updated_at com o horário do servidor a cada gravação.
-- O app usa esse horário para baixar só o que mudou desde a última vez.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Exercícios criados pela pessoa (os da biblioteca padrão ficam no app)
-- ---------------------------------------------------------------------
create table if not exists public.custom_exercises (
  user_id      uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  id           text        not null,
  name         text        not null check (char_length(name) between 1 and 200),
  muscle_group text        not null,
  deleted      boolean     not null default false,
  updated_at   timestamptz not null default now(),
  primary key (user_id, id)
);

-- ---------------------------------------------------------------------
-- Treinos montados (ex: "Peito" com a lista de exercícios)
-- ---------------------------------------------------------------------
create table if not exists public.workouts (
  user_id      uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  id           text        not null,
  name         text        not null check (char_length(name) between 1 and 200),
  exercise_ids jsonb       not null default '[]'::jsonb,
  created_at   timestamptz not null default now(),
  deleted      boolean     not null default false,
  updated_at   timestamptz not null default now(),
  primary key (user_id, id)
);

-- ---------------------------------------------------------------------
-- Treinos realizados (cada dia de treino, com séries, cargas e reps)
-- ---------------------------------------------------------------------
create table if not exists public.sessions (
  user_id      uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  id           text        not null,
  workout_id   text        not null,
  workout_name text        not null,
  date         timestamptz not null,
  exercises    jsonb       not null default '[]'::jsonb,
  deleted      boolean     not null default false,
  updated_at   timestamptz not null default now(),
  primary key (user_id, id)
);

-- Índices para a sincronização ("o que mudou desde X?") ser rápida.
create index if not exists custom_exercises_sync_idx on public.custom_exercises (user_id, updated_at);
create index if not exists workouts_sync_idx         on public.workouts (user_id, updated_at);
create index if not exists sessions_sync_idx         on public.sessions (user_id, updated_at);

-- Gatilhos de updated_at
drop trigger if exists custom_exercises_updated_at on public.custom_exercises;
create trigger custom_exercises_updated_at before insert or update on public.custom_exercises
  for each row execute function public.set_updated_at();

drop trigger if exists workouts_updated_at on public.workouts;
create trigger workouts_updated_at before insert or update on public.workouts
  for each row execute function public.set_updated_at();

drop trigger if exists sessions_updated_at on public.sessions;
create trigger sessions_updated_at before insert or update on public.sessions
  for each row execute function public.set_updated_at();

-- Row Level Security: cada pessoa só acessa os próprios dados.
alter table public.custom_exercises enable row level security;
alter table public.workouts         enable row level security;
alter table public.sessions         enable row level security;

drop policy if exists "Dono acessa seus exercicios" on public.custom_exercises;
create policy "Dono acessa seus exercicios" on public.custom_exercises
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Dono acessa seus treinos" on public.workouts;
create policy "Dono acessa seus treinos" on public.workouts
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Dono acessa seus registros" on public.sessions;
create policy "Dono acessa seus registros" on public.sessions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
