// Aba Progresso: junta a evolução por exercício e o histórico de treinos,
// alternando entre os dois com um seletor no topo para manter a tela limpa.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, EmptyState, StatusBadge } from '@/components/ui';
import { useStore } from '@/data/store';
import { formatDateLong, formatSet, formatWeight } from '@/lib/format';
import { exerciseHistory } from '@/lib/progress';
import { colors, statusColors } from '@/theme';

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

type View_ = 'exercicios' | 'historico';

export default function ProgressScreen() {
  const { sessions } = useStore();
  const [view, setView] = useState<View_>('exercicios');

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon="trending-up-outline"
        title="Sem dados ainda"
        text="Registre seus treinos e acompanhe aqui sua evolução e seu histórico."
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.segmented}>
        <Segment label="Exercícios" active={view === 'exercicios'} onPress={() => setView('exercicios')} />
        <Segment label="Histórico" active={view === 'historico'} onPress={() => setView('historico')} />
      </View>
      {view === 'exercicios' ? <ExercisesView /> : <HistoryView />}
    </ScrollView>
  );
}

function Segment({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.segment, active && styles.segmentActive]}>
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
    </Pressable>
  );
}

function ExercisesView() {
  const { sessions, getExercise } = useStore();
  const [now] = useState(() => Date.now());

  const exerciseIds = [...new Set(sessions.flatMap((s) => s.exercises.map((e) => e.exerciseId)))];
  const items = exerciseIds
    .map((id) => ({ id, exercise: getExercise(id), history: exerciseHistory(sessions, id) }))
    .filter((item) => item.history.length > 0)
    .sort((a, b) => b.history.at(-1)!.date.localeCompare(a.history.at(-1)!.date));

  const since = new Date(now - THIRTY_DAYS).toISOString();
  const recent = items.flatMap((i) => i.history.filter((h) => h.date >= since));
  const loadUps = recent.filter((h) => h.status === 'carga').length;
  const microUps = recent.filter((h) => h.status === 'micro').length;

  return (
    <>
      <Text style={styles.summary}>
        Últimos 30 dias: <Text style={{ color: statusColors.carga }}>{loadUps} de carga</Text>
        {' · '}
        <Text style={{ color: statusColors.micro }}>{microUps} micro</Text>
      </Text>

      {items.map(({ id, exercise, history }) => {
        const first = history[0];
        const last = history.at(-1)!;
        const diff = last.best.weight - first.best.weight;
        return (
          <Pressable key={id} onPress={() => router.push({ pathname: '/exercicio/[id]', params: { id } })}>
            <Card style={styles.row}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.name}>{exercise?.name ?? 'Exercício removido'}</Text>
                <Text style={styles.meta}>
                  {formatSet(last.best)}
                  {diff !== 0 ? ` · ${diff > 0 ? '+' : ''}${formatWeight(diff)}kg desde o início` : ''}
                </Text>
              </View>
              <StatusBadge status={last.status} />
              <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
            </Card>
          </Pressable>
        );
      })}
    </>
  );
}

function HistoryView() {
  const { sessions } = useStore();
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      {sorted.map((session) => (
        <Pressable
          key={session.id}
          onPress={() => router.push({ pathname: '/sessao/[id]', params: { id: session.id } })}>
          <Card style={styles.row}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.name}>{session.workoutName}</Text>
              <Text style={styles.meta}>
                {formatDateLong(session.date)} · {session.exercises.length} exercício
                {session.exercises.length === 1 ? '' : 's'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
          </Card>
        </Pressable>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 10 },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 4,
  },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 9 },
  segmentActive: { backgroundColor: colors.cardAlt },
  segmentText: { color: colors.textFaint, fontWeight: '700', fontSize: 15 },
  segmentTextActive: { color: colors.text },
  summary: { color: colors.textMuted, fontSize: 14, marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  meta: { color: colors.textMuted, fontSize: 14 },
});
