import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/social/Avatar';
import { Button, Card, EmptyState } from '@/components/ui';
import { useAuth } from '@/data/auth';
import { listBlocked, unblockUser } from '@/data/social';
import type { BlockedPerson } from '@/data/social';
import { confirmAction, notify } from '@/lib/format';
import { colors, fonts } from '@/theme';

/** Pessoas que eu bloqueei, com a opção de desbloquear. */
export default function BlockedScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [people, setPeople] = useState<BlockedPerson[] | null>(null);

  const load = useCallback(() => {
    listBlocked()
      .then(setPeople)
      .catch((e) => {
        setPeople([]);
        notify('Não deu para carregar', (e as Error).message);
      });
  }, []);

  useFocusEffect(load);

  function unblock(person: BlockedPerson) {
    confirmAction(
      `Desbloquear ${person.displayName}?`,
      'A pessoa volta a poder te achar e te mandar pedidos de amizade. A amizade antiga não volta sozinha: mande um pedido de novo se quiser.',
      'Desbloquear',
      () =>
        unblockUser(userId!, person.userId)
          .then(() => {
            setPeople((list) => (list ?? []).filter((p) => p.userId !== person.userId));
            notify('Desbloqueado', `${person.displayName} foi desbloqueado.`);
          })
          .catch((e) => notify('Não deu para desbloquear', (e as Error).message))
    );
  }

  if (!userId) {
    return <EmptyState icon="ban-outline" title="Entre na sua conta" text="Os bloqueios ficam na sua conta." />;
  }
  if (people === null) return <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />;
  if (people.length === 0) {
    return (
      <EmptyState
        icon="ban-outline"
        title="Ninguém bloqueado"
        text="Quando você bloqueia alguém, a pessoa aparece aqui e você pode desbloquear quando quiser."
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {people.map((person) => (
        <Card key={person.userId} style={styles.row}>
          <Avatar name={person.displayName} icon={person.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{person.displayName}</Text>
            <Text style={styles.username}>@{person.username}</Text>
          </View>
          <Button title="Desbloquear" variant="secondary" small onPress={() => unblock(person)} />
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 10, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { color: colors.text, fontFamily: fonts.bold, fontSize: 15 },
  username: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13 },
});
