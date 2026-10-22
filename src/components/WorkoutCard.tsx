// Card de um treino montado: nome, exercícios, último registro e o botão de registrar.
// Usado na aba Treinos e dentro dos blocos.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card } from '@/components/ui';
import { useStore } from '@/data/store';
import type { Workout } from '@/data/store';
import { lastDone } from '@/lib/blocks';
import { formatShortDate } from '@/lib/format';
import { colors, fonts } from '@/theme';

type Props = { workout: Workout; position?: number; onShare?: () => void };

export function WorkoutCard({ workout, position, onShare }: Props) {
  const { sessions, drafts, getExercise } = useStore();
  const last = lastDone(sessions, workout.id);
  const names = workout.exerciseIds.map((id) => getExercise(id)?.name).filter(Boolean);
  const inProgress = Boolean(drafts[workout.id]);

  return (
    <Card style={{ gap: 12 }}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>
            {position !== undefined ? `${position} · ` : ''}
            {workout.name}
          </Text>
          <Text style={styles.meta}>
            {workout.exerciseIds.length} exercício{workout.exerciseIds.length === 1 ? '' : 's'}
            {last ? ` · último em ${formatShortDate(last)}` : ' · nunca feito'}
          </Text>
          {inProgress && <Text style={styles.inProgress}>● Em andamento</Text>}
        </View>
        {onShare && (
          <Pressable hitSlop={10} accessibilityLabel={`Compartilhar treino ${workout.name}`} onPress={onShare}>
            <Ionicons name="share-social-outline" size={22} color={colors.primary} />
          </Pressable>
        )}
        <Pressable
          hitSlop={10}
          accessibilityLabel={`Editar treino ${workout.name}`}
          onPress={() => router.push({ pathname: '/treino/editar', params: { id: workout.id } })}>
          <Ionicons name="create-outline" size={22} color={colors.textMuted} />
        </Pressable>
      </View>
      <Text style={styles.exercises} numberOfLines={2}>
        {names.join(' · ')}
      </Text>
      <Button
        title={inProgress ? 'Continuar treino' : 'Registrar treino'}
        icon={inProgress ? 'time-outline' : 'play'}
        onPress={() => router.push({ pathname: '/registrar/[id]', params: { id: workout.id } })}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  name: { color: colors.text, fontSize: 25, fontFamily: fonts.display, textTransform: 'uppercase', letterSpacing: 0.4 },
  meta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14, marginTop: 2 },
  exercises: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  inProgress: { color: colors.primary, fontSize: 13, fontFamily: fonts.bold, marginTop: 4 },
});
