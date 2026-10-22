import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ProgressView } from '@/components/ProgressView';
import { ShareTargetSheet } from '@/components/social/ShareTargetSheet';
import { useSharedTraining } from '@/components/social/useSharedTraining';
import { Button, Card, EmptyState, Segmented, SectionTitle } from '@/components/ui';
import { WorkoutCard } from '@/components/WorkoutCard';
import { WorkoutsEmptyArt } from '@/components/WorkoutsEmptyArt';
import { useAuth } from '@/data/auth';
import type { SharedBlock, SharedWorkout } from '@/data/social';
import { useStore } from '@/data/store';
import { blockWorkouts } from '@/lib/blocks';
import { colors, fonts, outlineColor } from '@/theme';

type Tab = 'treinos' | 'progresso';

export default function WorkoutsScreen() {
  // A Início pode abrir esta aba direto no Progresso (link "+N conquistas na semana").
  const { aba, v } = useLocalSearchParams<{ aba?: string; v?: string }>();
  const [tab, setTab] = useState<Tab>(aba === 'progresso' ? 'progresso' : 'treinos');
  const [lastLink, setLastLink] = useState(v);
  if (v !== lastLink) {
    setLastLink(v);
    if (aba === 'progresso') setTab('progresso');
  }

  return (
    <View style={styles.screen}>
      <View style={styles.tabs}>
        <Segmented
          options={[
            { key: 'treinos', label: 'Treinos' },
            { key: 'progresso', label: 'Progresso' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>
      {tab === 'treinos' ? <WorkoutList /> : <ProgressView />}
    </View>
  );
}

function WorkoutList() {
  const { workouts, blocks } = useStore();
  const { session } = useAuth();
  const { toSharedWorkout, toSharedBlock } = useSharedTraining();
  // O que está sendo compartilhado agora (só com conta, porque os chats ficam na nuvem).
  const [sharing, setSharing] = useState<{ workout: SharedWorkout } | { block: SharedBlock } | null>(null);
  const canShare = Boolean(session);
  // Treinos que não estão em nenhum bloco aparecem soltos, depois das pastas.
  const inBlocks = new Set(blocks.flatMap((b) => b.workoutIds));
  const loose = workouts.filter((w) => !inBlocks.has(w.id));

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Button title="Criar treino" icon="add" onPress={() => router.push('/treino/editar')} />
      <Button
        title="Criar bloco de treino"
        icon="folder-outline"
        variant="secondary"
        onPress={() => router.push('/bloco/editar')}
      />

      {workouts.length === 0 && blocks.length === 0 ? (
        <EmptyState
          illustration={<WorkoutsEmptyArt />}
          title="Nenhum treino ainda"
          text={'Crie seu primeiro treino, por exemplo "Peito", e escolha os exercícios dele.'}
        />
      ) : (
        <>
          <SectionTitle>Meus treinos</SectionTitle>
          {blocks.map((block) => {
            const count = blockWorkouts(block, workouts).length;
            return (
              <Pressable
                key={block.id}
                onPress={() => router.push({ pathname: '/bloco/[id]', params: { id: block.id } })}>
                <Card style={styles.blockRow}>
                  <View style={styles.blockIcon}>
                    <Text style={styles.blockEmoji}>{block.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.blockName} numberOfLines={1}>
                      {block.name}
                    </Text>
                    <Text style={styles.meta}>
                      Bloco · {count} treino{count === 1 ? '' : 's'}
                    </Text>
                  </View>
                  {canShare && count > 0 && (
                    <Pressable
                      hitSlop={10}
                      accessibilityLabel={`Compartilhar bloco ${block.name}`}
                      onPress={() => setSharing({ block: toSharedBlock(block) })}>
                      <Ionicons name="share-social-outline" size={22} color={colors.primary} />
                    </Pressable>
                  )}
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </Card>
              </Pressable>
            );
          })}
          {loose.map((workout) => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              onShare={canShare ? () => setSharing({ workout: toSharedWorkout(workout) }) : undefined}
            />
          ))}
        </>
      )}
      {sharing && <ShareTargetSheet visible onClose={() => setSharing(null)} content={sharing} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  tabs: { paddingHorizontal: 16, paddingTop: 8 },
  content: { padding: 16, gap: 12 },
  meta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14, marginTop: 2 },
  blockRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  blockIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.cardAlt,
    borderWidth: 2,
    borderColor: outlineColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockEmoji: { fontSize: 24 },
  blockName: {
    color: colors.text,
    fontSize: 25,
    fontFamily: fonts.display,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
