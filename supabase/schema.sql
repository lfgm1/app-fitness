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

-- ---------------------------------------------------------------------
-- Perfil da pessoa (nome, nascimento e dados para metas e estimativas)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  user_id              uuid        primary key references auth.users (id) on delete cascade,
  name                 text        check (char_length(name) between 1 and 100),
  birth_date           date        check (birth_date between '1900-01-01' and current_date),
  sex                  text        check (sex in ('male', 'female', 'unspecified')),
  height_cm            smallint    check (height_cm between 100 and 250),
  weight_kg            numeric(5,1) check (weight_kg between 30 and 300),
  goal                 text        check (goal in ('gain_muscle', 'lose_fat', 'strength', 'health')),
  experience           text        check (experience in ('beginner', 'intermediate', 'advanced')),
  daily_step_goal      integer     check (daily_step_goal >= 1000),
  onboarding_completed boolean     not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "Dono le seu perfil" on public.profiles;
create policy "Dono le seu perfil" on public.profiles
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Dono cria seu perfil" on public.profiles;
create policy "Dono cria seu perfil" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Dono altera seu perfil" on public.profiles;
create policy "Dono altera seu perfil" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Cria o perfil quando a conta é criada, com o nome e a data de nascimento
-- informados no cadastro (ou o nome vindo do Google).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name  text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name')), '');
  v_birth date;
begin
  begin
    v_birth := (new.raw_user_meta_data ->> 'birth_date')::date;
    if v_birth < date '1900-01-01' or v_birth > current_date then
      v_birth := null;
    end if;
  exception when others then
    v_birth := null;
  end;

  insert into public.profiles (user_id, name, birth_date)
  values (new.id, left(v_name, 100), v_birth)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Preferências (unidade de peso e séries padrão) e exclusão de conta
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists weight_unit text not null default 'kg' check (weight_unit in ('kg', 'lb')),
  add column if not exists default_sets smallint not null default 2 check (default_sets between 1 and 10);

-- Exclui a conta de quem está logado. Os dados (perfil, treinos, registros e
-- exercícios) são apagados junto, pelas chaves estrangeiras "on delete cascade".
-- Pode ser chamada por usuários logados de propósito: só apaga a própria conta.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;
  delete from auth.users where id = v_user;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ------------------------------------------------------------------
-- Limpeza automática dos itens excluídos
-- O app não apaga na hora: marca como "deleted" para os outros aparelhos ficarem sabendo
-- da exclusão na sincronização. Depois de 30 dias, o banco apaga de vez, todo dia às 03:00
-- (horário de Brasília). A função fica no schema "private", fora do alcance da API.
-- ------------------------------------------------------------------
create extension if not exists pg_cron;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.purge_deleted_records()
returns void
language sql
set search_path = ''
as $$
  delete from public.sessions         where deleted and updated_at < now() - interval '30 days';
  delete from public.workouts         where deleted and updated_at < now() - interval '30 days';
  delete from public.custom_exercises where deleted and updated_at < now() - interval '30 days';
$$;

revoke all on function private.purge_deleted_records() from public, anon, authenticated;

select cron.schedule('purge-deleted-records', '0 6 * * *', 'select private.purge_deleted_records()');
