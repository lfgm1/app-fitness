// Progresso (exibido dentro da aba Treinos): evolução por exercício e histórico de treinos,
// alternando entre os dois com um seletor pequeno para manter a tela limpa.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ExerciseImage } from '@/components/ExerciseImage';
import { ProgressEmptyArt } from '@/components/ProgressEmptyArt';
import { Card, EmptyState, Segmented, StatusBadge } from '@/components/ui';
import { isTimedExercise } from '@/data/exercises';
import { useStore } from '@/data/store';
import type { Session, Workout } from '@/data/store';
import { confirmAction, formatDateLong, formatShortDate } from '@/lib/format';
import { exerciseHistory } from '@/lib/progress';
import { useUnits } from '@/lib/units';
import { colors, fonts, outlineColor, statusColors } from '@/theme';

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

type View_ = 'exercicios' | 'historico';

export function ProgressView() {
  const { sessions } = useStore();
  const [view, setView] = useState<View_>('exercicios');

  if (sessions.length === 0) {
    return (
      <EmptyState
        illustration={<ProgressEmptyArt />}
        title="Sem dados ainda"
        text="Registre seus treinos e acompanhe aqui sua evolução e seu histórico."
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Segmented
        small
        options={[
          { key: 'exercicios', label: 'Exercícios', icon: 'barbell-outline' },
          { key: 'historico', label: 'Histórico', icon: 'calendar-outline' },
        ]}
        value={view}
        onChange={setView}
      />
      {view === 'exercicios' ? <ExercisesView /> : <HistoryView />}
    </ScrollView>
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
                const delta = units.delta(first.best, last.best);
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
                        {delta ? ` · ${delta} desde o início` : ''}
                      </Text>
                    </View>
                    <StatusBadge status={last.status} timed={isTimedExercise(id)} />
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
              style={styles.rowAction}
              onPress={() =>
                router.push({ pathname: '/registrar/[id]', params: { id: session.workoutId, sessao: session.id } })
              }
              hitSlop={6}
              accessibilityLabel={`Editar treino ${session.workoutName}`}>
              <Ionicons name="create-outline" size={18} color={colors.text} />
            </Pressable>
            <Pressable
              style={styles.rowAction}
              onPress={() => removeOne(session.id, session.workoutName, session.date)}
              hitSlop={6}
              accessibilityLabel={`Remover treino ${session.workoutName}`}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </Pressable>
          </Card>
        </Pressable>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  rowAction: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.cardAlt,
    borderWidth: 2,
    borderColor: outlineColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  group: { padding: 0, overflow: 'hidden' },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  groupName: { color: colors.text, fontSize: 23, fontFamily: fonts.display, textTransform: 'uppercase', letterSpacing: 0.4 },
  groupUps: { color: statusColors.carga, fontSize: 13, fontFamily: fonts.bold, marginTop: 2 },
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
  clearAll: { color: colors.danger, fontSize: 14, fontFamily: fonts.bold },
  content: { padding: 16, gap: 10 },
  summary: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14, marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { color: colors.text, fontSize: 16, fontFamily: fonts.bold },
  meta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14 },
});
