import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card, EmptyState, SectionTitle } from '@/components/ui';
import { useStore } from '@/data/store';
import { formatShortDate } from '@/lib/format';
import { colors } from '@/theme';

export default function WorkoutsScreen() {
  const { workouts, sessions, drafts, getExercise } = useStore();

  function lastDone(workoutId: string) {
    const dates = sessions.filter((s) => s.workoutId === workoutId).map((s) => s.date);
    return dates.length ? dates.sort().at(-1) : undefined;
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Button title="Criar treino" icon="add" onPress={() => router.push('/treino/editar')} />

      {workouts.length === 0 ? (
        <EmptyState
          icon="barbell-outline"
          title="Nenhum treino ainda"
          text={'Crie seu primeiro treino, por exemplo "Peito", e escolha os exercícios dele.'}
        />
      ) : (
        <>
          <SectionTitle>Meus treinos</SectionTitle>
          {workouts.map((workout) => {
            const last = lastDone(workout.id);
            const names = workout.exerciseIds.map((id) => getExercise(id)?.name).filter(Boolean);
            const inProgress = Boolean(drafts[workout.id]);
            return (
              <Card key={workout.id} style={{ gap: 12 }}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{workout.name}</Text>
                    <Text style={styles.meta}>
                      {workout.exerciseIds.length} exercício{workout.exerciseIds.length === 1 ? '' : 's'}
                      {last ? ` · último em ${formatShortDate(last)}` : ' · nunca feito'}
                    </Text>
                    {inProgress && <Text style={styles.inProgress}>● Em andamento</Text>}
                  </View>
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
          })}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  name: { color: colors.text, fontSize: 20, fontWeight: '800' },
  meta: { color: colors.textMuted, fontSize: 14, marginTop: 2 },
  exercises: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  inProgress: { color: colors.primary, fontSize: 13, fontWeight: '700', marginTop: 4 },
});
