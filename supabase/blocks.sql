-- ==================================================================
-- Blocos de treino: pastas com treinos em ordem (ex.: "PPL + UP", "Torso + Limbs"), só para organizar.
-- O mesmo treino pode estar em vários blocos.
-- Funciona igual aos treinos: salvo no celular primeiro e sincronizado (veja src/data/sync.ts).
-- ==================================================================

create table if not exists public.workout_blocks (
  user_id     uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  id          text        not null,
  name        text        not null check (char_length(name) between 1 and 60),
  emoji       text        not null default '💪' check (char_length(emoji) between 1 and 8),
  -- Treinos do bloco, na ordem em que são feitos.
  workout_ids jsonb       not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  deleted     boolean     not null default false,
  updated_at  timestamptz not null default now(),
  primary key (user_id, id)
);
create index if not exists workout_blocks_sync_idx on public.workout_blocks (user_id, updated_at);

drop trigger if exists workout_blocks_updated_at on public.workout_blocks;
create trigger workout_blocks_updated_at before insert or update on public.workout_blocks
  for each row execute function public.set_updated_at();

alter table public.workout_blocks enable row level security;
drop policy if exists "Dono acessa seus blocos" on public.workout_blocks;
create policy "Dono acessa seus blocos" on public.workout_blocks
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Limpeza automática: blocos excluídos também somem de vez depois de 30 dias.
create or replace function private.purge_deleted_records()
returns void
language sql
set search_path = ''
as $$
  delete from public.sessions         where deleted and updated_at < now() - interval '30 days';
  delete from public.workouts         where deleted and updated_at < now() - interval '30 days';
  delete from public.custom_exercises where deleted and updated_at < now() - interval '30 days';
  delete from public.workout_blocks   where deleted and updated_at < now() - interval '30 days';
$$;
revoke all on function private.purge_deleted_records() from public, anon, authenticated;

-- Compartilhar um bloco inteiro numa conversa do Social.
alter table public.messages drop constraint if exists messages_kind_check;
alter table public.messages add constraint messages_kind_check check (kind in ('text', 'workout', 'block'));

-- O bloco serve só para organizar (não existe "bloco ativo").
alter table public.workout_blocks drop column if exists active;
