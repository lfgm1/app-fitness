// Janela para escolher para quem mandar um treino ou bloco: um amigo (no privado) ou um grupo.

import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/social/Avatar';
import { GroupIcon } from '@/components/social/GroupIcon';
import { Button, Card, SectionTitle } from '@/components/ui';
import { useAuth } from '@/data/auth';
import { getProfiles, listFriendships, listMyClubs, sendMessage } from '@/data/social';
import type { Club, SharedBlock, SharedWorkout, SocialProfile } from '@/data/social';
import { notify } from '@/lib/format';
import { colors, fonts, hardShadow, outline, radius } from '@/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  content: { workout: SharedWorkout } | { block: SharedBlock };
};

export function ShareTargetSheet(props: Props) {
  // Só carrega amigos e grupos quando a janela abre.
  return props.visible ? <ShareTargetContent {...props} /> : null;
}

function ShareTargetContent({ onClose, content }: Props) {
  const { session } = useAuth();
  const userId = session!.user.id;
  const [friends, setFriends] = useState<SocialProfile[] | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listFriendships(userId), listMyClubs()])
      .then(async ([friendships, myClubs]) => {
        const ids = friendships.filter((f) => f.status === 'accepted').map((f) => f.otherId);
        const people = await getProfiles(ids);
        if (cancelled) return;
        setFriends(ids.map((id) => people[id]).filter(Boolean));
        setClubs(myClubs);
      })
      .catch(() => !cancelled && setFriends([]));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function send(target: { clubId?: string; peerId?: string }, name: string) {
    setSending(true);
    try {
      await sendMessage(userId, target, content);
      notify('Enviado!', `Mandamos para ${name}.`);
      onClose();
    } catch (e) {
      notify('Não deu para enviar', (e as Error).message);
    } finally {
      setSending(false);
    }
  }

  const what = 'block' in content ? `o bloco "${content.block.name}"` : `o treino "${content.workout.name}"`;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>Compartilhar</Text>
          <Text style={styles.muted}>Para quem você quer mandar {what}?</Text>
          {friends === null ? (
            <ActivityIndicator color={colors.primary} />
          ) : friends.length === 0 && clubs.length === 0 ? (
            <Text style={styles.muted}>
              Você ainda não tem amigos nem grupos. Adicione alguém na aba Social para compartilhar.
            </Text>
          ) : (
            <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ gap: 8 }}>
              {clubs.length > 0 && <SectionTitle>Grupos</SectionTitle>}
              {clubs.map((club) => (
                <Pressable key={club.id} disabled={sending} onPress={() => send({ clubId: club.id }, club.name)}>
                  <Card style={styles.row}>
                    <GroupIcon icon={club.icon} emoji={club.emoji} size={36} />
                    <Text style={styles.name} numberOfLines={1}>
                      {club.name}
                    </Text>
                  </Card>
                </Pressable>
              ))}
              {friends.length > 0 && <SectionTitle>Amigos</SectionTitle>}
              {friends.map((friend) => (
                <Pressable
                  key={friend.userId}
                  disabled={sending}
                  onPress={() => send({ peerId: friend.userId }, friend.displayName)}>
                  <Card style={styles.row}>
                    <Avatar name={friend.displayName} icon={friend.avatar} size={36} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{friend.displayName}</Text>
                      <Text style={styles.muted}>@{friend.username}</Text>
                    </View>
                  </Card>
                </Pressable>
              ))}
            </ScrollView>
          )}
          <Button title="Cancelar" variant="ghost" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 20 },
  sheet: {
    gap: 10,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: radius + 4,
    ...outline,
    ...hardShadow(colors.primary),
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 26,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  name: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, flex: 1 },
  muted: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
});
