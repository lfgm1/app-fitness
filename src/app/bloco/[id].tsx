import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ShareTargetSheet } from '@/components/social/ShareTargetSheet';
import { useSharedTraining } from '@/components/social/useSharedTraining';
import { Button, EmptyState } from '@/components/ui';
import { WorkoutCard } from '@/components/WorkoutCard';
import { useStore } from '@/data/store';
import { blockWorkouts } from '@/lib/blocks';
import { colors, fonts, outlineColor } from '@/theme';

/** Dentro de um bloco: os treinos dele, em ordem. */
export default function BlockScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { blocks, workouts } = useStore();
  const { toSharedBlock } = useSharedTraining();
  const [sharing, setSharing] = useState(false);
  const block = blocks.find((b) => b.id === id);

  if (!block) {
    return <EmptyState icon="folder-open-outline" title="Bloco não encontrado" text="Ele pode ter sido excluído." />;
  }

  const list = blockWorkouts(block, workouts);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: block.name }} />
      <View style={styles.header}>
        <View style={styles.icon}>
          <Text style={styles.emoji}>{block.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{block.name}</Text>
          <Text style={styles.meta}>
            {list.length} treino{list.length === 1 ? '' : 's'}
          </Text>
        </View>
      </View>

      {list.length === 0 && (
        <Text style={styles.meta}>
          Este bloco ainda não tem treinos. Adicione os treinos que já existem ou crie um novo.
        </Text>
      )}
      {list.map((workout, index) => (
        <WorkoutCard key={workout.id} workout={workout} position={index + 1} />
      ))}

      <Button
        title="Criar treino neste bloco"
        icon="add"
        variant="secondary"
        onPress={() => router.push({ pathname: '/treino/editar', params: { bloco: block.id } })}
      />
      <View style={styles.actions}>
        <Button
          title="Editar bloco"
          icon="create-outline"
          variant="secondary"
          style={{ flex: 1 }}
          onPress={() => router.push({ pathname: '/bloco/editar', params: { id: block.id } })}
        />
        <Button
          title="Compartilhar"
          icon="share-social-outline"
          variant="secondary"
          style={{ flex: 1 }}
          onPress={() => setSharing(true)}
          disabled={list.length === 0}
        />
      </View>

      <ShareTargetSheet visible={sharing} onClose={() => setSharing(false)} content={{ block: toSharedBlock(block) }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 4 },
  icon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: colors.cardAlt,
    borderWidth: 2.5,
    borderColor: outlineColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 30 },
  name: { color: colors.text, fontFamily: fonts.display, fontSize: 32, textTransform: 'uppercase', letterSpacing: 0.4 },
  meta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 10 },
});
