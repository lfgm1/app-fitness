// Parte social: perfil público (@), amigos, grupos e mensagens.
// Diferente dos treinos, tudo aqui fica só no banco (precisa de internet): é conversa com outras pessoas.
// As regras de quem vê o quê ficam no banco (supabase/social.sql).

import { Platform, Share } from 'react-native';

import type { FrankPhase } from '@/lib/frank';
import { supabase } from '@/lib/supabase';

/** Quem vê o perfil. "nobody": ninguém vê o perfil nem acha pelo @ (o nome só aparece nas conversas). */
export type Visibility = 'friends' | 'everyone' | 'nobody';

export const VISIBILITY_LABELS: Record<Visibility, string> = {
  friends: 'Só amigos e clubes',
  everyone: 'Qualquer pessoa',
  nobody: 'Ninguém',
};

export type SocialProfile = {
  userId: string;
  username: string;
  displayName: string;
  friendCode: string;
  visibility: Visibility;
  showRecords: boolean;
  phase: FrankPhase;
  workoutCount: number;
  recordCount: number;
  weekCount: number;
  /** Ícone de perfil escolhido (null = inicial do nome). */
  avatar: string | null;
  /** Confirmação de leitura ligada (risquinhos azuis). */
  readReceipts: boolean;
};

export type Friendship = {
  id: string;
  /** A outra pessoa da amizade. */
  otherId: string;
  status: 'pending' | 'accepted';
  /** true se fui eu que pedi. */
  sentByMe: boolean;
};

export type Club = {
  id: string;
  name: string;
  emoji: string;
  /** Ícone escolhido (null nos grupos antigos, que mostram o emoji). */
  icon: string | null;
  ownerId: string;
  inviteCode: string;
};
export type ClubMember = { userId: string; role: 'owner' | 'admin' | 'member' };

/** Treino enviado numa conversa: leva os nomes dos exercícios, para quem recebe poder copiar. */
export type SharedWorkout = {
  name: string;
  exercises: { id: string; name: string; group: string; custom: boolean }[];
};

/** Bloco enviado numa conversa: o nome, o emoji e todos os treinos dele, em ordem. */
export type SharedBlock = { name: string; emoji: string; workouts: SharedWorkout[] };

export type Message = {
  id: string;
  clubId: string | null;
  senderId: string;
  recipientId: string | null;
  kind: 'text' | 'workout' | 'block';
  body: string | null;
  workout: SharedWorkout | null;
  block: SharedBlock | null;
  deleted: boolean;
  createdAt: string;
  /** Só no aparelho de quem mandou, antes do servidor confirmar: enviando ou falhou. */
  pending?: 'sending' | 'failed';
};

type Row = Record<string, unknown>;

export function toProfile(row: Row): SocialProfile {
  return {
    userId: row.user_id as string,
    username: row.username as string,
    displayName: row.display_name as string,
    friendCode: row.friend_code as string,
    visibility: row.visibility as Visibility,
    showRecords: row.show_records as boolean,
    phase: (row.phase as FrankPhase) ?? 'ovo',
    workoutCount: (row.workout_count as number) ?? 0,
    recordCount: (row.record_count as number) ?? 0,
    weekCount: (row.week_count as number) ?? 0,
    avatar: (row.avatar as string) ?? null,
    readReceipts: (row.read_receipts as boolean) ?? true,
  };
}

export function toMessage(row: Row): Message {
  return {
    id: row.id as string,
    clubId: (row.club_id as string) ?? null,
    senderId: row.sender_id as string,
    recipientId: (row.recipient_id as string) ?? null,
    kind: row.kind as Message['kind'],
    body: (row.body as string) ?? null,
    workout: row.kind === 'workout' ? ((row.payload as SharedWorkout) ?? null) : null,
    block: row.kind === 'block' ? ((row.payload as SharedBlock) ?? null) : null,
    deleted: Boolean(row.deleted),
    createdAt: row.created_at as string,
  };
}

function fail(error: { message: string; code?: string } | null): never | void {
  if (!error) return;
  if (error.code === '23505') throw new Error('Este @ já está em uso. Escolha outro.');
  throw new Error(error.message);
}

// ---------- Perfil ----------

/** "Luiz Gomes" -> "luiz.gomes" (sugestão de @). */
export function suggestUsername(name: string) {
  return (
    name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '')
      .slice(0, 20) || 'atleta'
  );
}

export function isValidUsername(username: string) {
  return /^[a-z0-9._]{3,20}$/.test(username);
}

/** O @ está livre? (funciona antes do login, na tela de cadastro) */
export async function usernameAvailable(username: string) {
  const { data, error } = await supabase.rpc('username_available', { p_username: username });
  fail(error);
  return Boolean(data);
}

/** Quem já tinha conta antes do @ no cadastro ganha um @ livre parecido com o nome (dá para trocar depois). */
export async function ensureMyProfile(name: string) {
  const { error } = await supabase.rpc('ensure_my_social_profile', {
    p_username: suggestUsername(name),
    p_display_name: name,
  });
  fail(error);
}

export async function getProfile(userId: string): Promise<SocialProfile | null> {
  const { data, error } = await supabase.from('social_profiles').select('*').eq('user_id', userId).maybeSingle();
  fail(error);
  return data ? toProfile(data) : null;
}

/** O básico de um perfil (nome, @ e ícone), mesmo quando o perfil completo é só para amigos. */
export async function getProfileCard(
  userId: string
): Promise<Pick<SocialProfile, 'userId' | 'username' | 'displayName' | 'avatar'> | null> {
  const { data, error } = await supabase.rpc('profile_card', { p_user: userId });
  fail(error);
  const row = (data as Row[] | null)?.[0];
  return row
    ? {
        userId: row.user_id as string,
        username: row.username as string,
        displayName: row.display_name as string,
        avatar: (row.avatar as string) ?? null,
      }
    : null;
}

export async function getProfiles(userIds: string[]): Promise<Record<string, SocialProfile>> {
  if (userIds.length === 0) return {};
  const { data, error } = await supabase.from('social_profiles').select('*').in('user_id', userIds);
  fail(error);
  return Object.fromEntries((data ?? []).map((row) => [row.user_id, toProfile(row)]));
}

export async function saveMyProfile(
  userId: string,
  changes: Pick<SocialProfile, 'username' | 'displayName' | 'visibility' | 'showRecords' | 'avatar'>
) {
  const { error } = await supabase.from('social_profiles').upsert({
    user_id: userId,
    username: changes.username,
    display_name: changes.displayName,
    visibility: changes.visibility,
    show_records: changes.showRecords,
    avatar: changes.avatar,
  });
  fail(error);
}

/** Atualiza o resumo público (fase do Frank e números). Só se o perfil social já existir. */
export async function updateMyStats(
  userId: string,
  stats: Pick<SocialProfile, 'phase' | 'workoutCount' | 'recordCount' | 'weekCount'>
) {
  const { error } = await supabase
    .from('social_profiles')
    .update({
      phase: stats.phase,
      workout_count: stats.workoutCount,
      record_count: stats.recordCount,
      week_count: stats.weekCount,
    })
    .eq('user_id', userId);
  fail(error);
}

export async function findUser(
  username: string
): Promise<Pick<SocialProfile, 'userId' | 'username' | 'displayName' | 'phase' | 'avatar'> | null> {
  const { data, error } = await supabase.rpc('find_user', { p_username: username });
  fail(error);
  const row = (data as Row[] | null)?.[0];
  return row
    ? {
        userId: row.user_id as string,
        username: row.username as string,
        displayName: row.display_name as string,
        phase: row.phase as FrankPhase,
        avatar: (row.avatar as string) ?? null,
      }
    : null;
}

// ---------- Amigos ----------

export async function listFriendships(userId: string): Promise<Friendship[]> {
  const { data, error } = await supabase.from('friendships').select('*');
  fail(error);
  return (data ?? []).map((row) => ({
    id: row.id,
    otherId: row.requester_id === userId ? row.addressee_id : row.requester_id,
    status: row.status,
    sentByMe: row.requester_id === userId,
  }));
}

export async function requestFriend(userId: string, otherId: string) {
  const { error } = await supabase.from('friendships').insert({ requester_id: userId, addressee_id: otherId });
  if (error?.code === '23505') throw new Error('Vocês já são amigos ou já existe um pedido entre vocês.');
  fail(error);
}

export async function acceptFriend(friendshipId: string) {
  const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
  fail(error);
}

export async function removeFriendship(friendshipId: string) {
  const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
  fail(error);
}

/** Bloqueia: desfaz a amizade e impede pedidos e mensagens nos dois sentidos. */
export async function blockUser(userId: string, otherId: string) {
  const { error } = await supabase.from('blocks').insert({ blocker_id: userId, blocked_id: otherId });
  if (error && error.code !== '23505') fail(error);
  await supabase
    .from('friendships')
    .delete()
    .or(
      `and(requester_id.eq.${userId},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${userId})`
    );
}

export type BlockedPerson = { userId: string; username: string; displayName: string; avatar: string | null };

/** Quem eu bloqueei (para poder desbloquear). */
export async function listBlocked(): Promise<BlockedPerson[]> {
  const { data, error } = await supabase.rpc('list_my_blocks');
  fail(error);
  return ((data ?? []) as { user_id: string; username: string; display_name: string; avatar: string | null }[]).map(
    (r) => ({
      userId: r.user_id,
      username: r.username,
      displayName: r.display_name,
      avatar: r.avatar,
    })
  );
}

/** Desbloqueia. A amizade não volta sozinha: é preciso mandar um pedido de novo. */
export async function unblockUser(userId: string, otherId: string) {
  const { error } = await supabase.from('blocks').delete().eq('blocker_id', userId).eq('blocked_id', otherId);
  fail(error);
}

export async function report(targetUserId: string, reason: string, messageId?: string) {
  const { error } = await supabase
    .from('reports')
    .insert({ target_user_id: targetUserId, message_id: messageId ?? null, reason });
  fail(error);
}

// ---------- Convites (código de amigo ou de grupo) ----------

export type InvitePreview =
  | { kind: 'friend'; id: string }
  | {
      kind: 'club';
      id: string;
      name: string;
      emoji: string;
      icon: string | null;
      memberCount: number;
      /** Os primeiros membros (dono e admins primeiro): só nome e ícone. */
      members: { name: string; avatar: string | null }[];
      isMember: boolean;
    };

/** O que um código é, sem entrar em nada: um grupo (com nome, ícone e membros) ou uma pessoa. */
export async function getInvitePreview(code: string): Promise<InvitePreview> {
  const { data, error } = await supabase.rpc('invite_preview', { p_code: code });
  if (error?.message.includes('Código inválido')) throw new Error('Código inválido. Confira e tente de novo.');
  fail(error);
  const row = (data as Row[] | null)?.[0];
  if (!row) throw new Error('Código inválido. Confira e tente de novo.');
  if (row.kind === 'friend') return { kind: 'friend', id: row.id as string };
  return {
    kind: 'club',
    id: row.id as string,
    name: row.name as string,
    emoji: row.emoji as string,
    icon: (row.icon as string) ?? null,
    memberCount: row.member_count as number,
    members: (row.members as { name: string; avatar: string | null }[]) ?? [],
    isMember: Boolean(row.is_member),
  };
}

/** Usa um código: o de amigo só encontra a pessoa; o de grupo entra no grupo. */
export async function acceptInvite(code: string): Promise<{ type: 'friend' | 'club'; id: string }> {
  const { data, error } = await supabase.rpc('accept_invite', { p_code: code });
  if (error?.message.includes('Código inválido')) throw new Error('Código inválido. Confira e tente de novo.');
  fail(error);
  const [type, id] = String(data).split(':');
  return { type: type as 'friend' | 'club', id };
}

export const SITE_URL = 'https://lfgm1-app-fitness.vercel.app';
export const inviteLink = (code: string) => `${SITE_URL}/convite/${code}`;

/** Abre o menu de compartilhar do celular com um texto. No computador, copia o texto. Retorna 'copiado' nesse caso. */
export async function shareText(message: string): Promise<'compartilhado' | 'copiado'> {
  if (Platform.OS === 'web' && !navigator.share) {
    await navigator.clipboard.writeText(message);
    return 'copiado';
  }
  try {
    await Share.share({ message });
  } catch (error) {
    if ((error as Error).name === 'AbortError') return 'compartilhado';
    throw error;
  }
  return 'compartilhado';
}

// ---------- Grupos ----------

export async function listMyClubs(): Promise<Club[]> {
  const { data, error } = await supabase.from('clubs').select('*').order('created_at');
  fail(error);
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    icon: row.icon ?? null,
    ownerId: row.owner_id,
    inviteCode: row.invite_code,
  }));
}

export async function createClub(name: string, icon: string) {
  const { data, error } = await supabase.rpc('create_club', { p_name: name, p_emoji: '💪', p_icon: icon });
  fail(error);
  return data as string;
}

/** Troca o ícone do grupo (só o dono consegue: o banco confere). */
export async function setClubIcon(clubId: string, icon: string) {
  const { data, error } = await supabase.from('clubs').update({ icon }).eq('id', clubId).select('id');
  fail(error);
  if (!data?.length) throw new Error('Só o dono do grupo pode trocar o ícone.');
}

/** Coloca amigos no grupo. Devolve quantos entraram (quem já era membro é ignorado). */
export async function addClubMembers(clubId: string, userIds: string[]) {
  const { data, error } = await supabase.rpc('add_club_members', { p_club: clubId, p_users: userIds });
  fail(error);
  return (data as number) ?? 0;
}

/** Dá (ou tira) administrador. Dar: dono ou admin. Tirar: só o dono. */
export async function setClubAdmin(clubId: string, userId: string, admin: boolean) {
  const { error } = await supabase.rpc('set_club_admin', { p_club: clubId, p_user: userId, p_admin: admin });
  fail(error);
}

/** Passa o grupo para outra pessoa (só o dono). O antigo dono vira administrador. */
export async function transferClubOwner(clubId: string, userId: string) {
  const { error } = await supabase.rpc('transfer_club_owner', { p_club: clubId, p_user: userId });
  fail(error);
}

export async function listClubMembers(clubId: string): Promise<ClubMember[]> {
  const { data, error } = await supabase.from('club_members').select('user_id, role').eq('club_id', clubId);
  fail(error);
  return (data ?? []).map((row) => ({ userId: row.user_id, role: row.role }));
}

export async function removeClubMember(clubId: string, userId: string) {
  const { error } = await supabase.from('club_members').delete().eq('club_id', clubId).eq('user_id', userId);
  fail(error);
}

export async function deleteClub(clubId: string) {
  const { error } = await supabase.from('clubs').delete().eq('id', clubId);
  fail(error);
}

// ---------- Mensagens ----------

const PAGE = 100;

/** Últimas mensagens de um grupo ou da conversa com uma pessoa (mais antigas primeiro). */
export async function listMessages(userId: string, target: { clubId?: string; peerId?: string }) {
  let query = supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(PAGE);
  if (target.clubId) query = query.eq('club_id', target.clubId);
  else
    query = query.or(
      `and(sender_id.eq.${userId},recipient_id.eq.${target.peerId}),and(sender_id.eq.${target.peerId},recipient_id.eq.${userId})`
    );
  const { data, error } = await query;
  fail(error);
  return (data ?? []).map(toMessage).reverse();
}

export async function sendMessage(
  userId: string,
  target: { clubId?: string; peerId?: string },
  content: { text: string } | { workout: SharedWorkout } | { block: SharedBlock }
) {
  const row =
    'text' in content
      ? { kind: 'text', body: content.text.trim().slice(0, 2000), payload: null }
      : 'workout' in content
        ? { kind: 'workout', body: content.workout.name, payload: content.workout }
        : { kind: 'block', body: content.block.name, payload: content.block };
  const { data, error } = await supabase
    .from('messages')
    .insert({ ...row, sender_id: userId, club_id: target.clubId ?? null, recipient_id: target.peerId ?? null })
    .select()
    .single();
  if (error?.code === '42501') throw new Error('Não foi possível enviar: vocês precisam ser amigos para conversar.');
  fail(error);
  return toMessage(data);
}

/** "Apagar para você": esconde a mensagem só para mim (os outros continuam vendo). */
export async function hideMessage(messageId: string) {
  const { error } = await supabase.from('message_hides').upsert({ message_id: messageId });
  fail(error);
}

/** Quais dessas mensagens eu escondi. */
export async function listHiddenIds(messageIds: string[]) {
  if (messageIds.length === 0) return new Set<string>();
  const { data, error } = await supabase.from('message_hides').select('message_id').in('message_id', messageIds);
  fail(error);
  return new Set((data ?? []).map((r) => r.message_id as string));
}

/** Por quanto tempo a própria mensagem ainda pode ser apagada (o banco confere a mesma regra). */
export const DELETE_WINDOW_MS = 5 * 60 * 1000;

export async function deleteMessage(messageId: string) {
  const { data, error } = await supabase.from('messages').update({ deleted: true }).eq('id', messageId).select('id');
  fail(error);
  // Nada foi alterado: passaram os 5 minutos.
  if (!data?.length) throw new Error('Mensagens só podem ser apagadas nos primeiros 5 minutos.');
}

// ---------- Confirmação de leitura ----------

/** Marca a conversa como lida agora (chatId = id do grupo ou do amigo). */
export async function markChatRead(chatId: string) {
  const { error } = await supabase.rpc('mark_chat_read', { p_chat: chatId });
  fail(error);
}

/** Até quando os outros leram a conversa (vazio se a confirmação de leitura estiver desligada). */
export async function getReadStatus(target: { clubId?: string; peerId?: string }) {
  const { data, error } = await supabase.rpc('chat_read_status', {
    p_club: target.clubId ?? null,
    p_peer: target.peerId ?? null,
  });
  fail(error);
  return ((data ?? []) as { user_id: string; read_at: string | null }[]).map((r) => ({
    userId: r.user_id,
    readAt: r.read_at,
  }));
}

/** Liga ou desliga a confirmação de leitura. */
export async function setReadReceipts(userId: string, on: boolean) {
  const { error } = await supabase.from('social_profiles').update({ read_receipts: on }).eq('user_id', userId);
  fail(error);
}

/** Conversas no privado: a última mensagem com cada pessoa, da mais recente para a mais antiga. */
export async function listConversations(userId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .is('club_id', null)
    .order('created_at', { ascending: false })
    .limit(300);
  fail(error);
  const latest = new Map<string, Message>();
  for (const message of (data ?? []).map(toMessage)) {
    const peer = message.senderId === userId ? message.recipientId! : message.senderId;
    if (!latest.has(peer)) latest.set(peer, message);
  }
  return [...latest.entries()].map(([peerId, last]) => ({ peerId, last }));
}

/** Avisa quando chega (ou é apagada) uma mensagem do grupo ou da conversa. Retorna a função para parar. */
export function subscribeMessages(
  userId: string,
  target: { clubId?: string; peerId?: string },
  onChange: (message: Message) => void
) {
  const filter = target.clubId ? `club_id=eq.${target.clubId}` : `recipient_id=eq.${userId}`;
  const channel = supabase
    .channel(`messages-${target.clubId ?? target.peerId}-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter }, (payload) => {
      const row = payload.new as Row;
      if (!row?.id) return;
      const message = toMessage(row);
      // No privado, só interessam as mensagens desta conversa.
      if (target.peerId && message.senderId !== target.peerId) return;
      onChange(message);
    })
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
