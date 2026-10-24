-- ==================================================================
-- Calorias: os alimentos que a pessoa registra em cada refeição do dia.
-- Funciona igual aos treinos: salvo no celular primeiro e sincronizado (veja src/data/sync.ts).
-- As calorias e os macros ficam guardados no registro (calculados pela tabela TACO na hora de
-- adicionar), para o histórico não mudar se a tabela de alimentos do app for atualizada.
-- ==================================================================

create table if not exists public.food_logs (
  user_id    uuid         not null default auth.uid() references auth.users (id) on delete cascade,
  id         text         not null,
  -- Dia da refeição no celular da pessoa (AAAA-MM-DD).
  day        date         not null,
  meal       text         not null check (meal in ('cafe', 'almoco', 'lanche', 'jantar')),
  food_id    integer      not null,
  food_name  text         not null check (char_length(food_name) between 1 and 120),
  -- Como a pessoa informou: 2 colheres, 1 concha ou 150 gramas.
  unit       text         not null check (unit in ('colher', 'concha', 'gramas')),
  quantity   numeric(7,2) not null check (quantity > 0 and quantity <= 5000),
  grams      numeric(7,1) not null check (grams > 0 and grams <= 5000),
  kcal       numeric(7,1) not null check (kcal >= 0),
  protein    numeric(6,1) not null default 0 check (protein >= 0),
  carbs      numeric(6,1) not null default 0 check (carbs >= 0),
  fat        numeric(6,1) not null default 0 check (fat >= 0),
  deleted    boolean      not null default false,
  updated_at timestamptz  not null default now(),
  primary key (user_id, id)
);
create index if not exists food_logs_sync_idx on public.food_logs (user_id, updated_at);

drop trigger if exists food_logs_updated_at on public.food_logs;
create trigger food_logs_updated_at before insert or update on public.food_logs
  for each row execute function public.set_updated_at();

alter table public.food_logs enable row level security;
drop policy if exists "Dono acessa suas refeicoes" on public.food_logs;
create policy "Dono acessa suas refeicoes" on public.food_logs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Limpeza automática: alimentos excluídos também somem de vez depois de 30 dias.
create or replace function private.purge_deleted_records()
returns void
language sql
set search_path = ''
as $$
  delete from public.sessions         where deleted and updated_at < now() - interval '30 days';
  delete from public.workouts         where deleted and updated_at < now() - interval '30 days';
  delete from public.custom_exercises where deleted and updated_at < now() - interval '30 days';
  delete from public.workout_blocks   where deleted and updated_at < now() - interval '30 days';
  delete from public.food_logs        where deleted and updated_at < now() - interval '30 days';
$$;
revoke all on function private.purge_deleted_records() from public, anon, authenticated;

-- ---------- Refeições com nome livre e refeições salvas ----------
-- A pessoa cria as refeições do dia com o nome que quiser ("Pré-treino", "Ceia"...): a coluna
-- meal guarda o nome. E os alimentos podem ser contados por unidade (ovo, fatia, copo...).
alter table public.food_logs drop constraint if exists food_logs_meal_check;
alter table public.food_logs add constraint food_logs_meal_check check (char_length(meal) between 1 and 40);
alter table public.food_logs drop constraint if exists food_logs_unit_check;
alter table public.food_logs add constraint food_logs_unit_check
  check (unit in ('colher', 'concha', 'unidade', 'gramas'));

-- Refeições salvas: um nome e os alimentos com as porções, para adicionar de uma vez em outro dia.
create table if not exists public.saved_meals (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  id         text        not null,
  name       text        not null check (char_length(name) between 1 and 40),
  -- [{ foodId, foodName, unit, quantity, grams, kcal, protein, carbs, fat }]
  items      jsonb       not null default '[]'::jsonb check (jsonb_array_length(items) <= 50),
  deleted    boolean     not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index if not exists saved_meals_sync_idx on public.saved_meals (user_id, updated_at);

drop trigger if exists saved_meals_updated_at on public.saved_meals;
create trigger saved_meals_updated_at before insert or update on public.saved_meals
  for each row execute function public.set_updated_at();

alter table public.saved_meals enable row level security;
drop policy if exists "Dono acessa suas refeicoes salvas" on public.saved_meals;
create policy "Dono acessa suas refeicoes salvas" on public.saved_meals
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function private.purge_deleted_records()
returns void
language sql
set search_path = ''
as $$
  delete from public.sessions         where deleted and updated_at < now() - interval '30 days';
  delete from public.workouts         where deleted and updated_at < now() - interval '30 days';
  delete from public.custom_exercises where deleted and updated_at < now() - interval '30 days';
  delete from public.workout_blocks   where deleted and updated_at < now() - interval '30 days';
  delete from public.food_logs        where deleted and updated_at < now() - interval '30 days';
  delete from public.saved_meals      where deleted and updated_at < now() - interval '30 days';
$$;
revoke all on function private.purge_deleted_records() from public, anon, authenticated;

-- Registros feitos antes (com as 4 refeições fixas) passam a usar o nome.
update public.food_logs set meal = case meal
  when 'cafe' then 'Café da manhã' when 'almoco' then 'Almoço' when 'lanche' then 'Lanche' when 'jantar' then 'Jantar'
  else meal end
where meal in ('cafe', 'almoco', 'lanche', 'jantar');

-- ---------- Medida em ml (açaí e milkshake, pelo tamanho do copo) ----------
alter table public.food_logs drop constraint if exists food_logs_unit_check;
alter table public.food_logs add constraint food_logs_unit_check
  check (unit in ('colher', 'concha', 'unidade', 'gramas', 'ml'));
