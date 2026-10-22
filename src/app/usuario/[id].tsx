import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/social/Avatar';
import { PhaseTag, ProfileStats } from '@/components/social/ProfileSummary';
import { Button, EmptyState } from '@/components/ui';
import { useAuth } from '@/data/auth';
import {
  acceptFriend,
  blockUser,
  getProfile,
  getProfileCard,
  listFriendships,
  removeFriendship,
  report,
  requestFriend,
} from '@/data/social';
import type { Friendship, SocialProfile } from '@/data/social';
import { confirmAction, notify } from '@/lib/format';
import { colors, fonts } from '@/theme';

/** Perfil público de outra pessoa. Se o perfil completo for só para amigos, mostra o básico e o pedido. */
export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const userId = session!.user.id;
  const [person, setPerson] = useState<SocialProfile | null | undefined>(undefined);
  const [friendship, setFriendship] = useState<Friendship | null>(null);
  // Nome, @ e ícone, para quando o perfil completo é só para amigos.
  const [card, setCard] = useState<Pick<SocialProfile, 'userId' | 'username' | 'displayName' | 'avatar'> | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, list] = await Promise.all([getProfile(id), listFriendships(userId)]);
      setCard(p ? null : await getProfileCard(id));
      setPerson(p);
      setFriendship(list.find((f) => f.otherId === id) ?? null);
    } catch {
      setPerson(null);
    }
  }, [id, userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function run(action: () => Promise<void>, done?: string) {
    try {
      await action();
      if (done) notify(done, '');
      await load();
    } catch (e) {
      notify('Não deu certo', (e as Error).message);
    }
  }

  if (person === undefined) return <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />;
  const basic = person ?? card;
  if (!basic) {
    return <EmptyState icon="person-outline" title="Perfil não encontrado" text="Essa pessoa não está disponível." />;
  }

  const isFriend = friendship?.status === 'accepted';
  // "Ninguém": o nome e o @ aparecem (para as conversas fazerem sentido), o resto não.
  const hidden = !person || person.visibility === 'nobody';

  function moreOptions() {
    confirmAction(
      'Bloquear?',
      `${basic!.displayName} não vai poder te mandar mensagens nem pedidos de amizade, e a amizade de vocês é desfeita.`,
      'Bloquear',
      () => run(() => blockUser(userId, basic!.userId)).then(() => router.back())
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: `@${basic.username}` }} />
      <View style={styles.avatar}>
        <Avatar name={basic.displayName} icon={basic.avatar} size={110} />
      </View>
      <Text style={styles.name}>{basic.displayName}</Text>
      <Text style={styles.username}>@{basic.username}</Text>
      {hidden || !person ? (
        <Text style={styles.privateText}>
          {person
            ? 'Perfil privado: esta pessoa escolheu não mostrar o perfil para ninguém.'
            : 'Esta pessoa mostra o perfil completo só para amigos.'}
        </Text>
      ) : (
        <>
          <PhaseTag person={person} />
          <View style={styles.statsWrap}>
            <ProfileStats person={person} />
          </View>
        </>
      )}

      <View style={styles.actions}>
        {isFriend ? (
          <>
            <Button
              title="Mensagem"
              icon="chatbubble-outline"
              onPress={() => router.push({ pathname: '/conversa/[id]', params: { id: basic.userId } })}
            />
            <Button
              title="Desfazer amizade"
              variant="secondary"
              onPress={() =>
                confirmAction('Desfazer amizade?', 'Vocês deixam de conversar no privado.', 'Desfazer', () =>
                  run(() => removeFriendship(friendship!.id))
                )
              }
            />
          </>
        ) : friendship?.status === 'pending' && !friendship.sentByMe ? (
          <Button title="Aceitar pedido de amizade" onPress={() => run(() => acceptFriend(friendship.id))} />
        ) : friendship?.status === 'pending' ? (
          <Button
            title="Cancelar pedido enviado"
            variant="secondary"
            onPress={() => run(() => removeFriendship(friendship.id))}
          />
        ) : (
          <Button
            title="Adicionar amigo"
            icon="person-add-outline"
            onPress={() =>
              run(() => requestFriend(userId, basic.userId)).then(() =>
                notify('Pedido enviado!', `Quando ${basic.displayName} aceitar, vocês viram amigos.`)
              )
            }
          />
        )}
        <Button
          title="Denunciar"
          variant="ghost"
          onPress={() =>
            confirmAction(
              'Denunciar perfil?',
              'Se ele for ofensivo ou falso, avise a gente. A pessoa não fica sabendo.',
              'Denunciar',
              () => run(() => report(basic.userId, 'Perfil denunciado pelo app'), 'Denúncia enviada')
            )
          }
        />
        <Button title="Bloquear" variant="ghost" onPress={moreOptions} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 8, paddingBottom: 40, alignItems: 'center' },
  name: { color: colors.text, fontFamily: fonts.display, fontSize: 34, textTransform: 'uppercase', letterSpacing: 0.4 },
  username: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 15, marginTop: -6 },
  avatar: { marginVertical: 12 },
  statsWrap: { width: '100%', marginTop: 12 },
  privateText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14, textAlign: 'center', marginTop: 8 },
  actions: { width: '100%', gap: 10, marginTop: 12 },
});
