-- ==================================================================
-- Parte social: perfil público (@), amigos, bloqueios, clubes (grupos), mensagens e denúncias.
-- Tudo some junto com a conta (on delete cascade em auth.users).
-- ==================================================================

-- ---------- Tabelas ----------

-- Perfil público: o @, o que aparece para os outros e um resumo dos números (o app atualiza).
create table if not exists public.social_profiles (
  user_id       uuid        primary key references auth.users (id) on delete cascade,
  username      text        not null unique check (username ~ '^[a-z0-9._]{3,20}$'),
  display_name  text        not null check (char_length(display_name) between 1 and 60),
  friend_code   text        not null unique default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6)),
  visibility    text        not null default 'friends' check (visibility in ('friends', 'everyone')),
  show_records  boolean     not null default true,
  phase         text        not null default 'ovo',
  workout_count integer     not null default 0,
  record_count  integer     not null default 0,
  week_count    integer     not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.friendships (
  id           uuid        primary key default gen_random_uuid(),
  requester_id uuid        not null references auth.users (id) on delete cascade,
  addressee_id uuid        not null references auth.users (id) on delete cascade,
  status       text        not null default 'pending' check (status in ('pending', 'accepted')),
  created_at   timestamptz not null default now(),
  check (requester_id <> addressee_id)
);
-- Um só pedido/amizade por par de pessoas, em qualquer direção.
create unique index if not exists friendships_pair
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index if not exists friendships_addressee on public.friendships (addressee_id);

create table if not exists public.blocks (
  blocker_id uuid        not null references auth.users (id) on delete cascade,
  blocked_id uuid        not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index if not exists blocks_blocked on public.blocks (blocked_id);

create table if not exists public.clubs (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null check (char_length(name) between 1 and 40),
  emoji       text        not null default '💪' check (char_length(emoji) between 1 and 8),
  owner_id    uuid        not null references auth.users (id) on delete cascade,
  invite_code text        not null unique default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8)),
  created_at  timestamptz not null default now()
);

create table if not exists public.club_members (
  club_id   uuid        not null references public.clubs (id) on delete cascade,
  user_id   uuid        not null references auth.users (id) on delete cascade,
  role      text        not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (club_id, user_id)
);
create index if not exists club_members_user on public.club_members (user_id);

-- Mensagem de clube (club_id) ou no privado (recipient_id): sempre um dos dois.
create table if not exists public.messages (
  id           uuid        primary key default gen_random_uuid(),
  club_id      uuid        references public.clubs (id) on delete cascade,
  sender_id    uuid        not null references auth.users (id) on delete cascade,
  recipient_id uuid        references auth.users (id) on delete cascade,
  kind         text        not null default 'text' check (kind in ('text', 'workout')),
  body         text        check (char_length(body) <= 2000),
  payload      jsonb,
  deleted      boolean     not null default false,
  created_at   timestamptz not null default now(),
  check ((club_id is null) <> (recipient_id is null))
);
create index if not exists messages_club on public.messages (club_id, created_at desc);
create index if not exists messages_dm_sender on public.messages (sender_id, created_at desc);
create index if not exists messages_dm_recipient on public.messages (recipient_id, created_at desc);

create table if not exists public.reports (
  id             uuid        primary key default gen_random_uuid(),
  reporter_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  target_user_id uuid        references auth.users (id) on delete set null,
  message_id     uuid        references public.messages (id) on delete set null,
  reason         text        check (char_length(reason) <= 500),
  created_at     timestamptz not null default now()
);

drop trigger if exists social_profiles_updated_at on public.social_profiles;
create trigger social_profiles_updated_at before update on public.social_profiles
  for each row execute function public.set_updated_at();

-- ---------- Funções de apoio das regras (schema "private", fora da API) ----------
create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.has_friendship(a uuid, b uuid, only_accepted boolean)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.friendships f
    where least(f.requester_id, f.addressee_id) = least(a, b)
      and greatest(f.requester_id, f.addressee_id) = greatest(a, b)
      and (not only_accepted or f.status = 'accepted')
  );
$$;

create or replace function private.is_blocked(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.blocks x
    where (x.blocker_id = a and x.blocked_id = b) or (x.blocker_id = b and x.blocked_id = a)
  );
$$;

create or replace function private.is_club_member(club uuid, member uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.club_members m where m.club_id = club and m.user_id = member);
$$;

create or replace function private.shares_club(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.club_members m1 join public.club_members m2 on m1.club_id = m2.club_id
    where m1.user_id = a and m2.user_id = b
  );
$$;

grant execute on function private.has_friendship(uuid, uuid, boolean) to authenticated;
grant execute on function private.is_blocked(uuid, uuid) to authenticated;
grant execute on function private.is_club_member(uuid, uuid) to authenticated;
grant execute on function private.shares_club(uuid, uuid) to authenticated;

-- ---------- Regras de acesso (RLS) ----------
alter table public.social_profiles enable row level security;
alter table public.friendships     enable row level security;
alter table public.blocks          enable row level security;
alter table public.clubs           enable row level security;
alter table public.club_members    enable row level security;
alter table public.messages        enable row level security;
alter table public.reports         enable row level security;

-- Perfil: o meu; público; de amigos (ou com pedido pendente); ou de quem está no mesmo clube.
-- Nunca de quem tem bloqueio com a gente.
drop policy if exists "ver perfis" on public.social_profiles;
create policy "ver perfis" on public.social_profiles for select to authenticated using (
  user_id = (select auth.uid())
  or (
    not private.is_blocked((select auth.uid()), user_id)
    and (
      visibility = 'everyone'
      or private.has_friendship((select auth.uid()), user_id, false)
      or private.shares_club((select auth.uid()), user_id)
    )
  )
);
drop policy if exists "criar meu perfil" on public.social_profiles;
create policy "criar meu perfil" on public.social_profiles for insert to authenticated
  with check (user_id = (select auth.uid()));
drop policy if exists "editar meu perfil" on public.social_profiles;
create policy "editar meu perfil" on public.social_profiles for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Amizades: só quem participa vê. Pedir: só em meu nome e sem bloqueio. Aceitar: só quem recebeu.
drop policy if exists "ver amizades" on public.friendships;
create policy "ver amizades" on public.friendships for select to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));
drop policy if exists "pedir amizade" on public.friendships;
create policy "pedir amizade" on public.friendships for insert to authenticated with check (
  requester_id = (select auth.uid()) and status = 'pending'
  and not private.is_blocked(requester_id, addressee_id)
);
drop policy if exists "aceitar amizade" on public.friendships;
create policy "aceitar amizade" on public.friendships for update to authenticated
  using (addressee_id = (select auth.uid())) with check (addressee_id = (select auth.uid()) and status = 'accepted');
drop policy if exists "desfazer amizade" on public.friendships;
create policy "desfazer amizade" on public.friendships for delete to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));
revoke update on public.friendships from authenticated;
grant update (status) on public.friendships to authenticated;

-- Bloqueios: cada um cuida dos seus.
drop policy if exists "meus bloqueios" on public.blocks;
create policy "meus bloqueios" on public.blocks for all to authenticated
  using (blocker_id = (select auth.uid())) with check (blocker_id = (select auth.uid()));

-- Clubes: só membros veem. Criar/entrar é pelas funções create_club/join_club. Dono edita e exclui.
drop policy if exists "ver clubes" on public.clubs;
create policy "ver clubes" on public.clubs for select to authenticated
  using (private.is_club_member(id, (select auth.uid())));
drop policy if exists "editar clube" on public.clubs;
create policy "editar clube" on public.clubs for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists "excluir clube" on public.clubs;
create policy "excluir clube" on public.clubs for delete to authenticated
  using (owner_id = (select auth.uid()));
revoke update on public.clubs from authenticated;
grant update (name, emoji) on public.clubs to authenticated;

-- Membros: quem é do clube vê os outros. Sair: a própria pessoa. Remover: o dono.
drop policy if exists "ver membros" on public.club_members;
create policy "ver membros" on public.club_members for select to authenticated
  using (private.is_club_member(club_id, (select auth.uid())));
drop policy if exists "sair ou remover" on public.club_members;
create policy "sair ou remover" on public.club_members for delete to authenticated using (
  user_id = (select auth.uid())
  or exists (select 1 from public.clubs c where c.id = club_id and c.owner_id = (select auth.uid()))
);

-- Mensagens: do clube (só membros) ou do privado (só os dois). No privado, só entre amigos e sem bloqueio.
drop policy if exists "ver mensagens" on public.messages;
create policy "ver mensagens" on public.messages for select to authenticated using (
  (club_id is not null and private.is_club_member(club_id, (select auth.uid())))
  or (club_id is null and (select auth.uid()) in (sender_id, recipient_id))
);
drop policy if exists "enviar mensagem" on public.messages;
create policy "enviar mensagem" on public.messages for insert to authenticated with check (
  sender_id = (select auth.uid()) and deleted = false
  and (
    (club_id is not null and private.is_club_member(club_id, sender_id))
    or (
      recipient_id is not null
      and private.has_friendship(sender_id, recipient_id, true)
      and not private.is_blocked(sender_id, recipient_id)
    )
  )
);
-- Apagar a própria mensagem (só marca como apagada).
drop policy if exists "apagar minha mensagem" on public.messages;
create policy "apagar minha mensagem" on public.messages for update to authenticated
  using (sender_id = (select auth.uid())) with check (sender_id = (select auth.uid()) and deleted = true);
revoke update on public.messages from authenticated;
grant update (deleted) on public.messages to authenticated;

-- Denúncias: qualquer um envia; ninguém lê pelo app (só pelo painel).
drop policy if exists "denunciar" on public.reports;
create policy "denunciar" on public.reports for insert to authenticated
  with check (reporter_id = (select auth.uid()));

-- ---------- Funções chamadas pelo app ----------

-- Procura alguém pelo @ exato (só o básico, para mandar o pedido de amizade).
create or replace function public.find_user(p_username text)
returns table (user_id uuid, username text, display_name text, phase text)
language sql stable security definer set search_path = '' as $$
  select p.user_id, p.username, p.display_name, p.phase
  from public.social_profiles p
  where p.username = lower(trim(leading '@' from trim(p_username)))
    and p.user_id <> auth.uid()
    and not private.is_blocked(auth.uid(), p.user_id);
$$;

-- Cria um clube com a pessoa como dona.
create or replace function public.create_club(p_name text, p_emoji text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_club uuid;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  insert into public.clubs (name, emoji, owner_id) values (trim(p_name), coalesce(nullif(trim(p_emoji), ''), '💪'), v_user)
    returning id into v_club;
  insert into public.club_members (club_id, user_id, role) values (v_club, v_user, 'owner');
  return v_club;
end;
$$;

-- Usa um código de convite: de amigo (6 letras, vira amizade na hora) ou de clube (8 letras, entra no clube).
-- Retorna 'friend:<id>' ou 'club:<id>'.
create or replace function public.accept_invite(p_code text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_code text := upper(replace(trim(p_code), '-', ''));
  v_target uuid;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;

  select user_id into v_target from public.social_profiles where friend_code = v_code;
  if v_target is not null then
    if v_target = v_user then raise exception 'Este é o seu próprio código'; end if;
    if private.is_blocked(v_user, v_target) then raise exception 'Código inválido'; end if;
    insert into public.friendships (requester_id, addressee_id, status) values (v_target, v_user, 'accepted')
      on conflict (least(requester_id, addressee_id), greatest(requester_id, addressee_id))
      do update set status = 'accepted';
    return 'friend:' || v_target;
  end if;

  select id into v_target from public.clubs where invite_code = v_code;
  if v_target is not null then
    insert into public.club_members (club_id, user_id) values (v_target, v_user) on conflict do nothing;
    return 'club:' || v_target;
  end if;

  raise exception 'Código inválido';
end;
$$;

revoke execute on function public.find_user(text) from public, anon;
revoke execute on function public.create_club(text, text) from public, anon;
revoke execute on function public.accept_invite(text) from public, anon;
grant execute on function public.find_user(text) to authenticated;
grant execute on function public.create_club(text, text) to authenticated;
grant execute on function public.accept_invite(text) to authenticated;

-- Mensagens chegam na hora no app (Realtime). As regras acima valem também aqui.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;

-- ---------- @ escolhido no cadastro ----------

-- O @ está livre? Pode ser chamada antes do login (tela de cadastro).
create or replace function public.username_available(p_username text)
returns boolean language sql stable security definer set search_path = '' as $$
  select lower(trim(leading '@' from trim(p_username))) ~ '^[a-z0-9._]{3,20}$'
     and not exists (
       select 1 from public.social_profiles where username = lower(trim(leading '@' from trim(p_username)))
     );
$$;
revoke execute on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated;

-- Um @ livre a partir de uma sugestão (se já existir, ganha números no fim: luiz -> luiz4821).
create or replace function private.unique_username(p_hint text)
returns text language plpgsql volatile security definer set search_path = '' as $$
declare
  v_base text := left(regexp_replace(lower(coalesce(p_hint, '')), '[^a-z0-9._]', '', 'g'), 16);
  v_candidate text;
begin
  if char_length(v_base) < 3 then v_base := 'atleta'; end if;
  v_candidate := left(regexp_replace(lower(coalesce(p_hint, '')), '[^a-z0-9._]', '', 'g'), 20);
  if char_length(v_candidate) < 3 then v_candidate := v_base || floor(random() * 9000 + 1000)::int; end if;
  while exists (select 1 from public.social_profiles where username = v_candidate) loop
    v_candidate := v_base || floor(random() * 9000 + 1000)::int;
  end loop;
  return v_candidate;
end;
$$;

-- Quem já tinha conta antes do @ no cadastro: cria o perfil do Clube com um @ livre.
create or replace function public.ensure_my_social_profile(p_username text, p_display_name text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  insert into public.social_profiles (user_id, username, display_name)
  values (auth.uid(), private.unique_username(p_username), left(coalesce(nullif(trim(p_display_name), ''), 'Atleta'), 60))
  on conflict (user_id) do nothing;
end;
$$;
revoke execute on function public.ensure_my_social_profile(text, text) from public, anon;
grant execute on function public.ensure_my_social_profile(text, text) to authenticated;

-- O cadastro cria a conta, o perfil e o perfil do Clube (com o @ escolhido) de uma vez.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name  text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name')), '');
  v_birth date;
  v_username text := nullif(trim(new.raw_user_meta_data ->> 'username'), '');
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

  -- Se alguém pegou o mesmo @ no mesmo instante, o cadastro não falha: o @ ganha números no fim.
  if v_username is not null then
    insert into public.social_profiles (user_id, username, display_name)
    values (new.id, private.unique_username(v_username), left(coalesce(v_name, 'Atleta'), 60))
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

-- ---------- Opção "Ninguém" em quem pode ver o perfil ----------
-- Ninguém vê o perfil (Frank, fase e números) e ninguém acha pelo @. O nome e o @ continuam
-- aparecendo para amigos e clubes só dentro das conversas, para as mensagens terem nome.
alter table public.social_profiles drop constraint if exists social_profiles_visibility_check;
alter table public.social_profiles
  add constraint social_profiles_visibility_check check (visibility in ('friends', 'everyone', 'nobody'));

-- Com "Ninguém", os números nem ficam guardados no perfil público (o banco zera).
create or replace function private.hide_private_stats()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.visibility = 'nobody' then
    new.phase := 'ovo';
    new.workout_count := 0;
    new.record_count := 0;
    new.week_count := 0;
  end if;
  return new;
end;
$$;
drop trigger if exists social_profiles_hide_private on public.social_profiles;
create trigger social_profiles_hide_private before insert or update on public.social_profiles
  for each row execute function private.hide_private_stats();

-- A busca pelo @ não encontra quem escolheu "Ninguém".
create or replace function public.find_user(p_username text)
returns table (user_id uuid, username text, display_name text, phase text)
language sql stable security definer set search_path = '' as $$
  select p.user_id, p.username, p.display_name, p.phase
  from public.social_profiles p
  where p.username = lower(trim(leading '@' from trim(p_username)))
    and p.user_id <> auth.uid()
    and p.visibility <> 'nobody'
    and not private.is_blocked(auth.uid(), p.user_id);
$$;

-- ---------- Pessoas bloqueadas ----------
-- O perfil de quem eu bloqueei fica escondido de mim, então a lista (para desbloquear) vem por aqui.
create or replace function public.list_my_blocks()
returns table (user_id uuid, username text, display_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.user_id, p.username, p.display_name
  from public.blocks b
  join public.social_profiles p on p.user_id = b.blocked_id
  where b.blocker_id = (select auth.uid())
  order by b.created_at desc;
$$;
revoke execute on function public.list_my_blocks() from public, anon;
grant execute on function public.list_my_blocks() to authenticated;
grant select, insert, delete on public.blocks to authenticated;

-- ---------- Ícone de perfil ----------
-- O id do ícone escolhido (ex.: 'halter', 'vampiro'). Vazio = mostra a inicial do nome.
alter table public.social_profiles add column if not exists avatar text
  check (avatar is null or avatar ~ '^[a-z0-9-]{1,40}$');

-- A busca por @ e a lista de bloqueados também devolvem o ícone (mudou o formato, então recria).
drop function if exists public.find_user(text);
create function public.find_user(p_username text)
returns table (user_id uuid, username text, display_name text, phase text, avatar text)
language sql stable security definer set search_path = '' as $$
  select p.user_id, p.username, p.display_name, p.phase, p.avatar
  from public.social_profiles p
  where p.username = lower(trim(leading '@' from trim(p_username)))
    and p.user_id <> auth.uid()
    and p.visibility <> 'nobody'
    and not private.is_blocked(auth.uid(), p.user_id);
$$;
revoke execute on function public.find_user(text) from public, anon;
grant execute on function public.find_user(text) to authenticated;

drop function if exists public.list_my_blocks();
create function public.list_my_blocks()
returns table (user_id uuid, username text, display_name text, avatar text)
language sql stable security definer set search_path = '' as $$
  select p.user_id, p.username, p.display_name, p.avatar
  from public.blocks b
  join public.social_profiles p on p.user_id = b.blocked_id
  where b.blocker_id = (select auth.uid())
  order by b.created_at desc;
$$;
revoke execute on function public.list_my_blocks() from public, anon;
grant execute on function public.list_my_blocks() to authenticated;

-- ---------- Adicionar amigos ao grupo ----------
-- Qualquer membro pode colocar no grupo pessoas que são amigas dele (amizade aceita, sem bloqueio).
-- Devolve quantas pessoas entraram (quem já era membro ou não é amigo é ignorado).
create or replace function public.add_club_members(p_club uuid, p_users uuid[])
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_user  uuid := auth.uid();
  v_count integer;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  if not private.is_club_member(p_club, v_user) then raise exception 'Você não está nesse grupo'; end if;
  if coalesce(array_length(p_users, 1), 0) > 50 then raise exception 'Escolha até 50 pessoas por vez'; end if;

  insert into public.club_members (club_id, user_id)
  select p_club, u
  from unnest(p_users) as u
  where u <> v_user
    and private.has_friendship(v_user, u, true)
    and not private.is_blocked(v_user, u)
  on conflict do nothing;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke execute on function public.add_club_members(uuid, uuid[]) from public, anon;
grant execute on function public.add_club_members(uuid, uuid[]) to authenticated;

-- ---------- Administradores do grupo ----------
-- Papel novo 'admin'. Dar admin: dono ou admin. Tirar admin: só o dono.
-- Remover alguém: a própria pessoa (sair); o dono remove qualquer um; admin remove só membros comuns.
alter table public.club_members drop constraint if exists club_members_role_check;
alter table public.club_members add constraint club_members_role_check check (role in ('owner', 'admin', 'member'));

create or replace function private.club_role(club uuid, member uuid)
returns text language sql stable security definer set search_path = '' as $$
  select m.role from public.club_members m where m.club_id = club and m.user_id = member;
$$;
grant execute on function private.club_role(uuid, uuid) to authenticated;

drop policy if exists "sair ou remover" on public.club_members;
create policy "sair ou remover" on public.club_members for delete to authenticated using (
  user_id = (select auth.uid())
  or (role <> 'owner' and private.club_role(club_id, (select auth.uid())) = 'owner')
  or (role = 'member' and private.club_role(club_id, (select auth.uid())) = 'admin')
);

create or replace function public.set_club_admin(p_club uuid, p_user uuid, p_admin boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_me     text := private.club_role(p_club, auth.uid());
  v_target text := private.club_role(p_club, p_user);
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if v_target is null then raise exception 'Essa pessoa não está no grupo'; end if;
  if v_target = 'owner' then raise exception 'O dono do grupo já tem todos os poderes'; end if;
  if p_admin then
    if v_me not in ('owner', 'admin') then raise exception 'Só o dono ou um administrador pode fazer isso'; end if;
  else
    if v_me is distinct from 'owner' then raise exception 'Só o dono do grupo pode tirar um administrador'; end if;
  end if;
  update public.club_members set role = case when p_admin then 'admin' else 'member' end
   where club_id = p_club and user_id = p_user;
end;
$$;
revoke execute on function public.set_club_admin(uuid, uuid, boolean) from public, anon;
grant execute on function public.set_club_admin(uuid, uuid, boolean) to authenticated;

-- ---------- Passar o grupo para outra pessoa ----------
-- Só o dono. A pessoa escolhida vira dona e o antigo dono vira administrador.
create or replace function public.transfer_club_owner(p_club uuid, p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then raise exception 'Not authenticated'; end if;
  if private.club_role(p_club, v_me) is distinct from 'owner' then
    raise exception 'Só o dono do grupo pode passar o grupo para outra pessoa';
  end if;
  if p_user = v_me then raise exception 'Você já é o dono'; end if;
  if private.club_role(p_club, p_user) is null then raise exception 'Essa pessoa não está no grupo'; end if;

  update public.clubs set owner_id = p_user where id = p_club;
  update public.club_members set role = 'owner' where club_id = p_club and user_id = p_user;
  update public.club_members set role = 'admin' where club_id = p_club and user_id = v_me;
end;
$$;
revoke execute on function public.transfer_club_owner(uuid, uuid) from public, anon;
grant execute on function public.transfer_club_owner(uuid, uuid) to authenticated;

-- ---------- Apagar mensagem só nos primeiros 5 minutos ----------
-- A hora de envio é sempre a do servidor (ninguém consegue mandar uma hora "no futuro" para ganhar tempo).
create or replace function private.message_created_now()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.created_at := now();
  return new;
end;
$$;
drop trigger if exists messages_created_now on public.messages;
create trigger messages_created_now before insert on public.messages
  for each row execute function private.message_created_now();

drop policy if exists "apagar minha mensagem" on public.messages;
create policy "apagar minha mensagem" on public.messages for update to authenticated
  using (sender_id = (select auth.uid()) and created_at > now() - interval '5 minutes')
  with check (sender_id = (select auth.uid()) and deleted = true);

-- ---------- Confirmação de leitura (risquinhos) ----------
-- Cada pessoa guarda até quando leu cada conversa: chat_id = id do grupo, ou id do amigo no privado.
-- Quem desliga a confirmação de leitura não mostra quando leu e também não vê quando os outros leram.
alter table public.social_profiles add column if not exists read_receipts boolean not null default true;

create table if not exists public.chat_reads (
  user_id uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  chat_id uuid        not null,
  read_at timestamptz not null default now(),
  primary key (user_id, chat_id)
);
create index if not exists chat_reads_chat on public.chat_reads (chat_id);
alter table public.chat_reads enable row level security;
drop policy if exists "minhas leituras" on public.chat_reads;
create policy "minhas leituras" on public.chat_reads for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Marca a conversa como lida agora (hora do servidor).
create or replace function public.mark_chat_read(p_chat uuid)
returns void language sql security invoker set search_path = '' as $$
  insert into public.chat_reads (user_id, chat_id, read_at) values (auth.uid(), p_chat, now())
  on conflict (user_id, chat_id) do update set read_at = now();
$$;
revoke execute on function public.mark_chat_read(uuid) from public, anon;
grant execute on function public.mark_chat_read(uuid) to authenticated;

-- Até quando os outros leram: no grupo, cada membro (com a confirmação ligada); no privado, o amigo.
-- Volta vazio se eu desliguei a minha confirmação de leitura.
create or replace function public.chat_read_status(p_club uuid, p_peer uuid)
returns table (user_id uuid, read_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then raise exception 'Not authenticated'; end if;
  if not coalesce((select p.read_receipts from public.social_profiles p where p.user_id = v_me), true) then
    return;
  end if;
  if p_club is not null then
    if not private.is_club_member(p_club, v_me) then return; end if;
    return query
      select m.user_id, r.read_at
      from public.club_members m
      join public.social_profiles p on p.user_id = m.user_id and p.read_receipts
      left join public.chat_reads r on r.user_id = m.user_id and r.chat_id = p_club
      where m.club_id = p_club and m.user_id <> v_me;
  elsif p_peer is not null then
    return query
      select p.user_id, r.read_at
      from public.social_profiles p
      left join public.chat_reads r on r.user_id = p.user_id and r.chat_id = v_me
      where p.user_id = p_peer and p.read_receipts;
  end if;
end;
$$;
revoke execute on function public.chat_read_status(uuid, uuid) from public, anon;
grant execute on function public.chat_read_status(uuid, uuid) to authenticated;

-- ---------- Ícone do grupo ----------
-- O id do ícone escolhido (ex.: 'brasil', 'galera'). O emoji continua guardado para grupos antigos.
alter table public.clubs add column if not exists icon text
  check (icon is null or icon ~ '^[a-z0-9-]{1,40}$');
grant update (name, emoji, icon) on public.clubs to authenticated;

drop function if exists public.create_club(text, text);
create or replace function public.create_club(p_name text, p_emoji text, p_icon text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_club uuid;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  insert into public.clubs (name, emoji, icon, owner_id)
  values (trim(p_name), coalesce(nullif(trim(p_emoji), ''), '💪'), nullif(trim(p_icon), ''), v_user)
    returning id into v_club;
  insert into public.club_members (club_id, user_id, role) values (v_club, v_user, 'owner');
  return v_club;
end;
$$;
revoke execute on function public.create_club(text, text, text) from public, anon;
grant execute on function public.create_club(text, text, text) to authenticated;

-- ---------- Apagar para você ----------
-- A mensagem some só para quem escondeu (os outros continuam vendo). Vale em qualquer aparelho.
create table if not exists public.message_hides (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  message_id uuid        not null references public.messages (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, message_id)
);
alter table public.message_hides enable row level security;
drop policy if exists "minhas mensagens escondidas" on public.message_hides;
create policy "minhas mensagens escondidas" on public.message_hides for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------- Código de amigo só mostra o perfil ----------
-- Usar o código de amigo (ou abrir o link) não faz a amizade na hora: só encontra a pessoa.
-- No perfil dela há "Adicionar amigo", que manda um pedido; a amizade vale quando ela aceitar.
-- Código de grupo continua entrando direto no grupo.
create or replace function public.accept_invite(p_code text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_code text := upper(replace(trim(p_code), '-', ''));
  v_target uuid;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;

  select user_id into v_target from public.social_profiles where friend_code = v_code;
  if v_target is not null then
    if v_target = v_user then raise exception 'Este é o seu próprio código'; end if;
    if private.is_blocked(v_user, v_target) then raise exception 'Código inválido'; end if;
    return 'friend:' || v_target;
  end if;

  select id into v_target from public.clubs where invite_code = v_code;
  if v_target is not null then
    insert into public.club_members (club_id, user_id) values (v_target, v_user) on conflict do nothing;
    return 'club:' || v_target;
  end if;

  raise exception 'Código inválido';
end;
$$;

-- O básico de um perfil (nome, @ e ícone), para mostrar a pessoa e o botão "Adicionar amigo"
-- mesmo quando o perfil completo é só para amigos. Nunca para quem tem bloqueio.
create or replace function public.profile_card(p_user uuid)
returns table (user_id uuid, username text, display_name text, avatar text)
language sql stable security definer set search_path = '' as $$
  select p.user_id, p.username, p.display_name, p.avatar
  from public.social_profiles p
  where p.user_id = p_user
    and auth.uid() is not null
    and not private.is_blocked(auth.uid(), p.user_id);
$$;
revoke execute on function public.profile_card(uuid) from public, anon;
grant execute on function public.profile_card(uuid) to authenticated;

-- ---------- Pedido pendente não mostra o perfil para quem pediu ----------
-- Antes, qualquer pedido pendente liberava o perfil completo (até para quem só mandou o pedido).
-- Agora: amigos (aceito), quem me mandou um pedido (para eu decidir), grupo em comum ou perfil público.
create or replace function private.sent_me_request(me uuid, other uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.friendships f
    where f.requester_id = other and f.addressee_id = me and f.status = 'pending'
  );
$$;
grant execute on function private.sent_me_request(uuid, uuid) to authenticated;

drop policy if exists "ver perfis" on public.social_profiles;
create policy "ver perfis" on public.social_profiles for select to authenticated using (
  user_id = (select auth.uid())
  or (
    not private.is_blocked((select auth.uid()), user_id)
    and (
      visibility = 'everyone'
      or private.has_friendship((select auth.uid()), user_id, true)
      or private.sent_me_request((select auth.uid()), user_id)
      or private.shares_club((select auth.uid()), user_id)
    )
  )
);

-- ---------- Prévia do convite (estilo WhatsApp) ----------
-- Pelo código, mostra o que ele é sem entrar em nada: o grupo (nome, ícone, membros) ou a pessoa.
-- Entrar no grupo continua sendo pelo accept_invite, quando a pessoa toca em "Entrar no grupo".
create or replace function public.invite_preview(p_code text)
returns table (
  kind text, id uuid, name text, emoji text, icon text,
  member_count integer, members jsonb, is_member boolean
)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_code text := upper(replace(trim(p_code), '-', ''));
  v_target uuid;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;

  select p.user_id into v_target from public.social_profiles p where p.friend_code = v_code;
  if v_target is not null then
    if v_target = v_user then raise exception 'Este é o seu próprio código'; end if;
    if private.is_blocked(v_user, v_target) then raise exception 'Código inválido'; end if;
    return query select 'friend'::text, v_target, null::text, null::text, null::text, null::integer, null::jsonb, null::boolean;
    return;
  end if;

  select c.id into v_target from public.clubs c where c.invite_code = v_code;
  if v_target is null then raise exception 'Código inválido'; end if;

  return query
    select 'club'::text, c.id, c.name, c.emoji, c.icon,
      (select count(*)::integer from public.club_members m where m.club_id = c.id),
      -- Os primeiros membros (dono e admins primeiro): só nome e ícone.
      coalesce((
        select jsonb_agg(jsonb_build_object('name', x.display_name, 'avatar', x.avatar))
        from (
          select p.display_name, p.avatar
          from public.club_members m
          join public.social_profiles p on p.user_id = m.user_id
          where m.club_id = c.id
          order by case m.role when 'owner' then 0 when 'admin' then 1 else 2 end, m.joined_at
          limit 6
        ) x
      ), '[]'::jsonb),
      private.is_club_member(c.id, v_user)
    from public.clubs c where c.id = v_target;
end;
$$;
revoke execute on function public.invite_preview(text) from public, anon;
grant execute on function public.invite_preview(text) to authenticated;
