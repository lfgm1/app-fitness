// Card de um treino montado. Começa minimizado (nome, quantos exercícios e o último registro);
// tocando no nome, abre a lista com o nome dos exercícios e o botão de registrar. Treino em andamento já vem aberto.
// Usado na aba Treinos e dentro dos blocos.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
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
  const inProgress = Boolean(drafts[workout.id]);
  const [open, setOpen] = useState(inProgress);

  return (
    <Card style={{ gap: 12 }}>
      <View style={styles.header}>
        <Pressable
          style={{ flex: 1 }}
          onPress={() => setOpen((o) => !o)}
          accessibilityRole="button"
          accessibilityLabel={`${open ? 'Minimizar' : 'Abrir'} treino ${workout.name}`}>
          <Text style={styles.name}>
            {position !== undefined ? `${position} · ` : ''}
            {workout.name}
          </Text>
          <Text style={styles.meta}>
            {workout.exerciseIds.length} exercício{workout.exerciseIds.length === 1 ? '' : 's'}
            {last ? ` · último em ${formatShortDate(last)}` : ' · nunca feito'}
          </Text>
          {inProgress && <Text style={styles.inProgress}>● Em andamento</Text>}
        </Pressable>
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
        <Pressable hitSlop={10} onPress={() => setOpen((o) => !o)} accessibilityLabel={open ? 'Minimizar' : 'Abrir'}>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={22} color={colors.textMuted} />
        </Pressable>
      </View>

      {open && (
        <>
          <View style={styles.list}>
            {workout.exerciseIds.map((id, index) => (
              <View key={id} style={styles.exercise}>
                <Text style={styles.number}>{index + 1}</Text>
                <Text style={styles.exerciseName} numberOfLines={1}>
                  {getExercise(id)?.name ?? 'Exercício removido'}
                </Text>
              </View>
            ))}
          </View>
          <Button
            title={inProgress ? 'Continuar treino' : 'Registrar treino'}
            icon={inProgress ? 'time-outline' : 'play'}
            onPress={() => router.push({ pathname: '/registrar/[id]', params: { id: workout.id } })}
          />
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  name: { color: colors.text, fontSize: 25, fontFamily: fonts.display, textTransform: 'uppercase', letterSpacing: 0.4 },
  meta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14, marginTop: 2 },
  inProgress: { color: colors.primary, fontSize: 13, fontFamily: fonts.bold, marginTop: 4 },
  list: { gap: 8 },
  exercise: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 2 },
  number: { color: colors.textFaint, fontFamily: fonts.mono, fontSize: 13, width: 16, textAlign: 'right' },
  exerciseName: { flex: 1, color: colors.text, fontFamily: fonts.semibold, fontSize: 14 },
});
