import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/social/Avatar';
import { GroupIcon } from '@/components/social/GroupIcon';
import { StreakStamp } from '@/components/social/StreakStamp';
import { computeStats } from '@/components/social/SocialStatsSync';
import { Button, Card, EmptyState, Segmented, SectionTitle } from '@/components/ui';
import { useAuth } from '@/data/auth';
import { useProfile } from '@/data/profile';
import {
  acceptFriend,
  ensureMyProfile,
  getProfile,
  getProfileCard,
  getProfiles,
  listConversations,
  listFriendships,
  listMyClubs,
  getFriendsPresence,
  removeFriendship,
  updateMyStats,
} from '@/data/social';
import type { Club, Friendship, Message, SocialProfile } from '@/data/social';
import { useStore } from '@/data/store';
import { profileStreak } from '@/lib/streak';
import { notify } from '@/lib/format';
import { colors, fonts } from '@/theme';

type Section = 'clubes' | 'conversas' | 'amigos';

type Data = {
  me: SocialProfile;
  friendships: Friendship[];
  clubs: Club[];
  conversations: { peerId: string; last: Message }[];
  people: Record<string, SocialProfile>;
  /** Nome e ícone de quem recebeu um pedido meu (o perfil completo só aparece depois que aceitar). */
  cards: Record<string, { displayName: string; avatar: string | null }>;
};

type Status = 'treinando' | 'online' | 'offline';
const STATUS_GROUPS: { key: Status; title: string }[] = [
  { key: 'treinando', title: 'Treinando agora' },
  { key: 'online', title: 'Online' },
  { key: 'offline', title: 'Offline' },
];
const STATUS_COLORS: Record<Status, string> = {
  treinando: colors.primary,
  online: '#5DCAA5',
  offline: colors.textFaint,
};
// De quanto em quanto tempo atualiza quem está online.
const PRESENCE_POLL_MS = 30 * 1000;

type FriendStatus = { online: boolean; activity: string | null; minutes?: number };

/** Status dos amigos, com há quantos minutos começaram o treino. */
async function loadPresence(): Promise<Record<string, FriendStatus>> {
  const raw = await getFriendsPresence();
  const now = Date.now();
  return Object.fromEntries(
    Object.entries(raw).map(([id, p]) => [
      id,
      {
        online: p.online,
        activity: p.activity,
        minutes: p.activitySince
          ? Math.max(0, Math.round((now - new Date(p.activitySince).getTime()) / 60000))
          : undefined,
      },
    ])
  );
}

export default function ClubScreen() {
  const { session } = useAuth();
  const { profile } = useProfile();
  const { sessions } = useStore();
  const userId = session!.user.id;
  const [section, setSection] = useState<Section>('clubes');
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // Online / treinando agora de cada amigo, e quais grupos da lista estão recolhidos.
  const [presence, setPresence] = useState<Record<string, FriendStatus>>({});
  const [closed, setClosed] = useState<Partial<Record<Status, boolean>>>({});

  // Com a aba Amigos aberta, atualiza o status de tempos em tempos.
  useEffect(() => {
    if (section !== 'amigos') return;
    let cancelled = false;
    const check = () =>
      loadPresence()
        .then((p) => !cancelled && setPresence(p))
        .catch(() => {});
    check();
    const timer = setInterval(check, PRESENCE_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [section]);

  const statusOf = (id: string): Status =>
    presence[id]?.activity ? 'treinando' : presence[id]?.online ? 'online' : 'offline';

  const load = useCallback(async () => {
    try {
      let me = await getProfile(userId);
      if (!me) {
        // Conta de antes do @ no cadastro: ganha um @ parecido com o nome (dá para trocar em Configurações).
        await ensureMyProfile(profile?.name ?? '');
        await updateMyStats(userId, computeStats(sessions, new Date())).catch(() => {});
        me = await getProfile(userId);
        if (!me) throw new Error('Não foi possível criar seu perfil social.');
      }
      const [friendships, clubs, conversations] = await Promise.all([
        listFriendships(userId),
        listMyClubs(),
        listConversations(userId),
      ]);
      const ids = [...new Set([...friendships.map((f) => f.otherId), ...conversations.map((c) => c.peerId)])];
      const people = await getProfiles(ids);
      const missing = ids.filter((id) => !people[id]);
      const found = await Promise.all(missing.map((id) => getProfileCard(id).catch(() => null)));
      const cards = Object.fromEntries(found.filter((c) => c !== null).map((c) => [c!.userId, c!]));
      setData({ me, friendships, clubs, conversations, people, cards });
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
    // sessions e profile só são usados ao criar o perfil pela primeira vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Recarrega sempre que a aba aparece (ex.: voltando de uma conversa).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function run(action: () => Promise<void>) {
    try {
      await action();
      await load();
    } catch (e) {
      notify('Não deu certo', (e as Error).message);
    }
  }

  if (error && !data) {
    return (
      <EmptyState
        icon="cloud-offline-outline"
        title="Sem conexão"
        text="O Social precisa de internet. Tente de novo."
      />
    );
  }
  if (!data) return <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />;

  const received = data.friendships.filter((f) => f.status === 'pending' && !f.sentByMe);
  const sent = data.friendships.filter((f) => f.status === 'pending' && f.sentByMe);
  const friends = data.friendships.filter((f) => f.status === 'accepted');

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}>
      <Segmented
        small
        options={[
          { key: 'clubes', label: 'Grupos' },
          { key: 'conversas', label: 'Mensagens' },
          { key: 'amigos', label: received.length > 0 ? `Amigos (${received.length})` : 'Amigos' },
        ]}
        value={section}
        onChange={setSection}
      />

      {section === 'clubes' && (
        <>
          {data.clubs.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Nenhum grupo ainda</Text>
              <Text style={styles.muted}>
                Crie um grupo com a galera da academia ou entre num grupo com o código de convite.
              </Text>
            </Card>
          ) : (
            data.clubs.map((club) => (
              <Pressable
                key={club.id}
                onPress={() => router.push({ pathname: '/clubes/[id]', params: { id: club.id } })}>
                <Card style={styles.row}>
                  <GroupIcon icon={club.icon} emoji={club.emoji} size={44} />
                  <Text style={[styles.name, { flex: 1 }]} numberOfLines={1}>
                    {club.name}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
                </Card>
              </Pressable>
            ))
          )}
          <Button title="Criar ou entrar num grupo" icon="add" onPress={() => router.push('/clubes/novo')} />
        </>
      )}

      {section === 'conversas' && (
        <>
          {data.conversations.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Nenhuma mensagem ainda</Text>
              <Text style={styles.muted}>Abra o perfil de um amigo e toque em Mensagem para começar.</Text>
            </Card>
          ) : (
            data.conversations.map(({ peerId, last }) => {
              const person = data.people[peerId];
              const preview = last.deleted
                ? 'Mensagem apagada'
                : last.kind === 'workout'
                  ? `Treino: ${last.body}`
                  : last.kind === 'block'
                    ? `Bloco: ${last.body}`
                    : (last.body ?? '');
              return (
                <Pressable
                  key={peerId}
                  onPress={() => router.push({ pathname: '/conversa/[id]', params: { id: peerId } })}>
                  <Card style={styles.row}>
                    <Avatar name={person?.displayName} icon={person?.avatar} streakWeeks={profileStreak(person)} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{person?.displayName ?? 'Alguém'}</Text>
                      <Text style={styles.muted} numberOfLines={1}>
                        {last.senderId === userId ? 'Você: ' : ''}
                        {preview}
                      </Text>
                    </View>
                  </Card>
                </Pressable>
              );
            })
          )}
        </>
      )}

      {section === 'amigos' && (
        <>
          {received.length > 0 && <SectionTitle>Pedidos de amizade</SectionTitle>}
          {received.map((f) => {
            const person = data.people[f.otherId];
            return (
              <Card key={f.id} style={[styles.row, styles.request]}>
                <Avatar name={person?.displayName} icon={person?.avatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{person?.displayName ?? 'Alguém'}</Text>
                  <Text style={styles.muted}>@{person?.username}</Text>
                </View>
                <Pressable onPress={() => run(() => removeFriendship(f.id))} hitSlop={8} accessibilityLabel="Recusar">
                  <Ionicons name="close" size={22} color={colors.textMuted} />
                </Pressable>
                <Button title="Aceitar" small onPress={() => run(() => acceptFriend(f.id))} />
              </Card>
            );
          })}

          {friends.length === 0 && (
            <>
              <SectionTitle>Seus amigos (0)</SectionTitle>
              <Text style={styles.muted}>Adicione amigos pelo @ ou mande seu código.</Text>
            </>
          )}
          {STATUS_GROUPS.map(({ key, title }) => {
            const list = friends.filter((f) => statusOf(f.otherId) === key);
            if (list.length === 0) return null;
            const isOpen = !closed[key];
            return (
              <View key={key} style={{ gap: 8 }}>
                <Pressable
                  style={styles.groupHeader}
                  onPress={() => setClosed((c) => ({ ...c, [key]: isOpen }))}
                  accessibilityRole="button">
                  <Text style={styles.groupTitle}>
                    {title} <Text style={styles.groupCount}>{list.length}</Text>
                  </Text>
                  <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
                </Pressable>
                {isOpen &&
                  list.map((f) => {
                    const person = data.people[f.otherId];
                    const status = presence[f.otherId];
                    const weeks = profileStreak(person);
                    return (
                      <Pressable
                        key={f.id}
                        onPress={() => router.push({ pathname: '/usuario/[id]', params: { id: f.otherId } })}>
                        <Card
                          style={[
                            styles.row,
                            key === 'treinando' && styles.training,
                            key === 'offline' && styles.offline,
                          ]}>
                          <View>
                            <Avatar name={person?.displayName} icon={person?.avatar} streakWeeks={weeks} />
                            <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[key] }]} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.name}>{person?.displayName ?? 'Amigo'}</Text>
                            {key === 'treinando' ? (
                              <View style={styles.statusLine}>
                                <Ionicons name="barbell" size={14} color={colors.primary} />
                                <Text
                                  style={[styles.muted, { color: colors.primary, flexShrink: 1 }]}
                                  numberOfLines={1}>
                                  Treinando {status?.activity}
                                  {status?.minutes !== undefined ? ` · há ${status.minutes} min` : ''}
                                </Text>
                              </View>
                            ) : (
                              <Text style={styles.muted}>{key === 'online' ? 'Online' : 'Offline'}</Text>
                            )}
                          </View>
                          <StreakStamp weeks={weeks} />
                        </Card>
                      </Pressable>
                    );
                  })}
              </View>
            );
          })}

          {sent.length > 0 && <SectionTitle>Pedidos enviados</SectionTitle>}
          {sent.map((f) => {
            const person = data.people[f.otherId] ?? data.cards[f.otherId];
            return (
              <Card key={f.id} style={styles.row}>
                <Avatar name={person?.displayName} icon={person?.avatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{person?.displayName ?? 'Alguém'}</Text>
                  <Text style={styles.muted}>Aguardando resposta</Text>
                </View>
                <Pressable onPress={() => run(() => removeFriendship(f.id))} hitSlop={8}>
                  <Text style={styles.cancel}>Cancelar</Text>
                </Pressable>
              </Card>
            );
          })}

          <Button title="Adicionar amigo" icon="person-add-outline" onPress={() => router.push('/amigos/adicionar')} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  groupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
  groupTitle: {
    color: colors.textMuted,
    fontFamily: fonts.bold,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  groupCount: { color: colors.textFaint },
  training: { borderColor: colors.primary },
  offline: { opacity: 0.6 },
  statusDot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: colors.card,
  },
  statusLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  request: { borderColor: colors.bico },
  name: { color: colors.text, fontFamily: fonts.bold, fontSize: 15 },
  muted: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  cancel: { color: colors.danger, fontFamily: fonts.bold, fontSize: 13 },
  emptyCard: { gap: 6, alignItems: 'center', paddingVertical: 20 },
  emptyTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 22,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
