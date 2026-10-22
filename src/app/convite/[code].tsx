import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/social/Avatar';
import { GroupIcon } from '@/components/social/GroupIcon';
import { Button, Card, EmptyState } from '@/components/ui';
import { useAuth } from '@/data/auth';
import { acceptInvite, getInvitePreview, getProfile } from '@/data/social';
import type { InvitePreview } from '@/data/social';
import { notify } from '@/lib/format';
import { colors, fonts } from '@/theme';

type ClubPreview = Extract<InvitePreview, { kind: 'club' }>;

/**
 * Convite (…/convite/CODIGO, ou um código digitado). Se a pessoa não estava logada, o login aparece antes
 * e, ao entrar, o app volta para esta tela. Código de grupo: mostra o grupo (estilo WhatsApp) com
 * "Entrar no grupo". Código de amigo: abre o perfil, onde dá para mandar o pedido.
 */
export default function InviteScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { session } = useAuth();
  const userId = session!.user.id;
  const [club, setClub] = useState<ClubPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getInvitePreview(code)
      .then((preview) => {
        if (cancelled) return;
        if (preview.kind === 'friend') router.replace({ pathname: '/usuario/[id]', params: { id: preview.id } });
        else setClub(preview);
      })
      .catch((e) => !cancelled && setError((e as Error).message));
    return () => {
      cancelled = true;
    };
  }, [code]);

  async function join() {
    if (!club) return;
    setJoining(true);
    try {
      if (!club.isMember) await acceptInvite(code);
      // Quem ainda não tem perfil no Social cai na aba Social para escolher o @ primeiro.
      const hasProfile = Boolean(await getProfile(userId));
      router.replace(hasProfile ? { pathname: '/clubes/[id]', params: { id: club.id } } : '/clube');
    } catch (e) {
      notify('Não deu para entrar', (e as Error).message);
      setJoining(false);
    }
  }

  if (error) {
    return <EmptyState icon="link-outline" title="Convite inválido" text="Esse código não existe ou não vale mais." />;
  }
  if (!club) return <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />;

  const others = club.memberCount - club.members.length;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Convite para grupo' }} />
      <GroupIcon icon={club.icon} emoji={club.emoji} size={120} />
      <Text style={styles.name}>{club.name}</Text>
      <Text style={styles.muted}>
        Grupo · {club.memberCount} membro{club.memberCount === 1 ? '' : 's'}
      </Text>

      <Card style={styles.members}>
        {club.members.map((member, index) => (
          <View key={`${member.name}-${index}`} style={styles.member}>
            <Avatar name={member.name} icon={member.avatar} size={36} />
            <Text style={styles.memberName} numberOfLines={1}>
              {member.name}
            </Text>
          </View>
        ))}
        {others > 0 && (
          <Text style={styles.muted}>
            e mais {others} pessoa{others === 1 ? '' : 's'}
          </Text>
        )}
      </Card>

      <View style={styles.actions}>
        <Button
          title={club.isMember ? 'Abrir o grupo' : joining ? 'Entrando...' : 'Entrar no grupo'}
          icon={club.isMember ? 'chatbubbles-outline' : 'enter-outline'}
          onPress={join}
          disabled={joining}
        />
        {club.isMember && <Text style={styles.muted}>Você já está neste grupo.</Text>}
        <Button title="Agora não" variant="ghost" onPress={() => router.back()} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 8, alignItems: 'center', paddingBottom: 40 },
  name: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 32,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    textAlign: 'center',
    marginTop: 8,
  },
  muted: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14, textAlign: 'center' },
  members: { alignSelf: 'stretch', gap: 10, marginTop: 12 },
  member: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  memberName: { flex: 1, color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
  actions: { alignSelf: 'stretch', gap: 10, marginTop: 12 },
});
