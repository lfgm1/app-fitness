import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ExerciseImage } from '@/components/ExerciseImage';
import { Button, Card, EmptyState, StatusBadge } from '@/components/ui';
import { useStore } from '@/data/store';
import { confirmAction, formatDateLong } from '@/lib/format';
import { useUnits } from '@/lib/units';
import { STATUS_INFO, compareSets, previousSets } from '@/lib/progress';
import type { ProgressStatus } from '@/lib/progress';
import { colors, statusColors } from '@/theme';

export default function SessionScreen() {
  const { id, novo } = useLocalSearchParams<{ id: string; novo?: string }>();
  const { sessions, getExercise, deleteSession } = useStore();
  const units = useUnits();
  const session = sessions.find((s) => s.id === id);

  if (!session) {
    return <EmptyState icon="alert-circle-outline" title="Registro não encontrado" text="Ele pode ter sido excluído." />;
  }

  const results = session.exercises.map((ex) => ({
    ...ex,
    status: compareSets(previousSets(sessions, ex.exerciseId, session.date), ex.sets),
  }));

  const counts = (status: ProgressStatus) => results.filter((r) => r.status === status).length;
  const highlights = (['carga', 'micro'] as const).filter((s) => counts(s) > 0);

  function remove() {
    confirmAction('Excluir registro?', 'Este treino será removido do histórico e dos gráficos.', 'Excluir', () => {
      deleteSession(session!.id);
      router.back();
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {novo === '1' && (
        <Card style={styles.banner}>
          <Ionicons name="trophy" size={28} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Treino salvo!</Text>
            <Text style={styles.bannerText}>
              {highlights.length > 0
                ? highlights.map((s) => `${counts(s)} ${STATUS_INFO[s].label.toLowerCase()}`).join(' · ')
                : 'Continue registrando para acompanhar sua evolução.'}
            </Text>
          </View>
        </Card>
      )}

      <View>
        <Text style={styles.title}>{session.workoutName}</Text>
        <Text style={styles.date}>{formatDateLong(session.date)}</Text>
      </View>

      {results.map((ex) => (
        <Pressable
          key={ex.exerciseId}
          onPress={() => router.push({ pathname: '/exercicio/[id]', params: { id: ex.exerciseId } })}>
          <Card style={{ gap: 10 }}>
            <View style={styles.exHeader}>
              <ExerciseImage exerciseId={ex.exerciseId} size={40} />
              <Text style={styles.exName}>{getExercise(ex.exerciseId)?.name ?? 'Exercício removido'}</Text>
              <StatusBadge status={ex.status} />
            </View>
            {ex.sets.map((set, i) => (
              <View key={i} style={styles.setRow}>
                <Text style={styles.setLabel}>Série {i + 1}</Text>
                <Text style={styles.setValue}>{units.set(set)}</Text>
              </View>
            ))}
            <Text style={[styles.statusText, { color: statusColors[ex.status] }]}>
              {STATUS_INFO[ex.status].label} · ver gráfico ›
            </Text>
          </Card>
        </Pressable>
      ))}

      {novo === '1' ? (
        <Button title="Concluir" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      ) : (
        <Button title="Excluir registro" icon="trash-outline" variant="danger" onPress={remove} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 14, borderColor: colors.primary },
  bannerTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  bannerText: { color: colors.textMuted, fontSize: 14, marginTop: 2, lineHeight: 20 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  date: { color: colors.textMuted, fontSize: 15, marginTop: 2 },
  exHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  exName: { color: colors.text, fontSize: 17, fontWeight: '700', flex: 1 },
  setRow: { flexDirection: 'row', justifyContent: 'space-between' },
  setLabel: { color: colors.textMuted, fontSize: 15 },
  setValue: { color: colors.text, fontSize: 15, fontWeight: '700' },
  statusText: { fontSize: 13, fontWeight: '700', marginTop: 2 },
});
