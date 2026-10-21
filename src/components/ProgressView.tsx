// Aba Progresso: junta a evolução por exercício e o histórico de treinos,
// alternando entre os dois com um seletor no topo para manter a tela limpa.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ExerciseImage } from '@/components/ExerciseImage';
import { Card, EmptyState, StatusBadge } from '@/components/ui';
import { useStore } from '@/data/store';
import type { Session, Workout } from '@/data/store';
import { confirmAction, formatDateLong, formatShortDate } from '@/lib/format';
import { exerciseHistory } from '@/lib/progress';
import { useUnits } from '@/lib/units';
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

const OLD_WORKOUTS = '__old';
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

type WorkoutGroup = {
  key: string;
  name: string;
  lastDate: string;
  exerciseIds: string[];
  recentUps: number;
};

/**
 * Agrupa os exercícios pelo treino em que foram feitos. Usa os registros (e não a
 * lista atual do treino), para nenhum exercício com histórico sumir. Um exercício
 * feito em dois treinos aparece nos dois; treinos excluídos viram "Treinos antigos".
 */
function groupByWorkout(sessions: Session[], workouts: Workout[], now: number): WorkoutGroup[] {
  const workoutById = new Map(workouts.map((w) => [w.id, w]));
  const groups = new Map<string, { name: string; lastDate: string; ids: Set<string>; sessionIds: Set<string> }>();

  for (const session of sessions) {
    const workout = workoutById.get(session.workoutId);
    const key = workout ? workout.id : OLD_WORKOUTS;
    const group = groups.get(key) ?? {
      name: workout ? workout.name : 'Treinos antigos',
      lastDate: session.date,
      ids: new Set<string>(),
      sessionIds: new Set<string>(),
    };
    if (session.date > group.lastDate) group.lastDate = session.date;
    session.exercises.forEach((e) => group.ids.add(e.exerciseId));
    group.sessionIds.add(session.id);
    groups.set(key, group);
  }

  const since = new Date(now - SEVEN_DAYS).toISOString();
  return [...groups.entries()]
    .map(([key, g]) => {
      const order = workoutById.get(key)?.exerciseIds ?? [];
      const position = (id: string) => (order.includes(id) ? order.indexOf(id) : order.length);
      const exerciseIds = [...g.ids].sort((a, b) => position(a) - position(b));
      const recentUps = exerciseIds
        .flatMap((id) => exerciseHistory(sessions, id))
        .filter(
          (h) => g.sessionIds.has(h.sessionId) && h.date >= since && (h.status === 'carga' || h.status === 'micro')
        ).length;
      return { key, name: g.name, lastDate: g.lastDate, exerciseIds, recentUps };
    })
    .sort((a, b) =>
      a.key === OLD_WORKOUTS ? 1 : b.key === OLD_WORKOUTS ? -1 : b.lastDate.localeCompare(a.lastDate)
    );
}

function ExercisesView() {
  const { sessions, workouts, getExercise } = useStore();
  const units = useUnits();
  const [now] = useState(() => Date.now());

  const groups = groupByWorkout(sessions, workouts, now);
  // O treino feito por último começa aberto; os outros, fechados.
  const [open, setOpen] = useState<Set<string>>(() => new Set(groups[0] ? [groups[0].key] : []));

  function toggle(key: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const since = new Date(now - THIRTY_DAYS).toISOString();
  const allIds = [...new Set(sessions.flatMap((s) => s.exercises.map((e) => e.exerciseId)))];
  const recent = allIds.flatMap((id) => exerciseHistory(sessions, id).filter((h) => h.date >= since));
  const loadUps = recent.filter((h) => h.status === 'carga').length;
  const microUps = recent.filter((h) => h.status === 'micro').length;

  return (
    <>
      <Text style={styles.summary}>
        Últimos 30 dias: <Text style={{ color: statusColors.carga }}>{loadUps} de carga</Text>
        {' · '}
        <Text style={{ color: statusColors.micro }}>{microUps} micro</Text>
      </Text>

      {groups.map((group) => {
        const expanded = open.has(group.key);
        return (
          <Card key={group.key} style={styles.group}>
            <Pressable
              style={styles.groupHeader}
              onPress={() => toggle(group.key)}
              accessibilityRole="button"
              accessibilityState={{ expanded }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.meta}>
                  Último em {formatShortDate(group.lastDate)} · {group.exerciseIds.length} exercício
                  {group.exerciseIds.length === 1 ? '' : 's'}
                </Text>
                {group.recentUps > 0 && (
                  <Text style={styles.groupUps}>
                    {group.recentUps} progress{group.recentUps === 1 ? 'ão' : 'ões'} nos últimos 7 dias
                  </Text>
                )}
              </View>
              <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
            </Pressable>

            {expanded &&
              group.exerciseIds.map((id) => {
                const history = exerciseHistory(sessions, id);
                const first = history[0];
                const last = history.at(-1)!;
                const diff = last.best.weight - first.best.weight;
                return (
                  <Pressable
                    key={id}
                    style={({ pressed }) => [styles.exerciseRow, pressed && { backgroundColor: colors.cardAlt }]}
                    onPress={() => router.push({ pathname: '/exercicio/[id]', params: { id } })}>
                    <ExerciseImage exerciseId={id} size={44} />
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={styles.name}>{getExercise(id)?.name ?? 'Exercício removido'}</Text>
                      <Text style={styles.meta}>
                        {units.set(last.best)}
                        {diff !== 0 ? ` · ${diff > 0 ? '+' : ''}${units.weight(diff)}${units.unit} desde o início` : ''}
                      </Text>
                    </View>
                    <StatusBadge status={last.status} />
                    <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
                  </Pressable>
                );
              })}
          </Card>
        );
      })}
    </>
  );
}

function HistoryView() {
  const { sessions, deleteSession, deleteAllSessions } = useStore();
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));

  function removeOne(id: string, name: string, date: string) {
    confirmAction(
      'Remover treino?',
      `"${name}" de ${formatDateLong(date)} será removido do histórico e dos gráficos.`,
      'Remover',
      () => deleteSession(id)
    );
  }

  function removeAll() {
    const count = sorted.length;
    confirmAction(
      'Apagar todo o histórico?',
      `Os ${count} treino${count === 1 ? '' : 's'} registrado${count === 1 ? '' : 's'} serão apagados, junto com os gráficos de progressão. Seus treinos montados e exercícios continuam salvos.`,
      'Apagar tudo',
      deleteAllSessions
    );
  }

  return (
    <>
      <View style={styles.historyHeader}>
        <Text style={styles.summary}>
          {sorted.length} treino{sorted.length === 1 ? '' : 's'} registrado{sorted.length === 1 ? '' : 's'}
        </Text>
        <Pressable onPress={removeAll} hitSlop={8} accessibilityRole="button">
          <Text style={styles.clearAll}>Apagar tudo</Text>
        </Pressable>
      </View>
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
            <Pressable
              onPress={() => removeOne(session.id, session.workoutName, session.date)}
              hitSlop={10}
              accessibilityLabel={`Remover treino ${session.workoutName}`}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
            <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
          </Card>
        </Pressable>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  group: { padding: 0, overflow: 'hidden' },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  groupName: { color: colors.text, fontSize: 18, fontWeight: '800' },
  groupUps: { color: statusColors.carga, fontSize: 13, fontWeight: '700', marginTop: 2 },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clearAll: { color: colors.danger, fontSize: 14, fontWeight: '700' },
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
