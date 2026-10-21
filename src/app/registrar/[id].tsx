import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ExerciseImage } from '@/components/ExerciseImage';
import { Button, Card, EmptyState } from '@/components/ui';
import { useProfile } from '@/data/profile';
import { useStore } from '@/data/store';
import type { DraftSet, Session, SessionExercise, SetEntry, Workout } from '@/data/store';
import {
  daysAgo,
  formatDayLabel,
  formatShortDate,
  notify,
  parseNumber,
  shiftDays,
} from '@/lib/format';
import { previousRecord, previousSets } from '@/lib/progress';
import { useUnits } from '@/lib/units';
import { colors, statusColors } from '@/theme';

const MAX_SETS = 12;

/** Séries em branco para cada exercício (mesma quantidade da última vez, ou o padrão). */
function emptySets(workout: Workout | undefined, sessions: Session[], defaultSets: number) {
  const result: Record<string, DraftSet[]> = {};
  workout?.exerciseIds.forEach((exId) => {
    const count = previousSets(sessions, exId)?.length ?? defaultSets;
    result[exId] = Array.from({ length: count }, () => ({ weight: '', reps: '' }));
  });
  return result;
}

export default function LogWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { workouts, sessions, drafts, getExercise, addSession, saveDraft, clearDraft } = useStore();
  const { profile } = useProfile();
  const units = useUnits();
  const defaultSets = profile?.defaultSets ?? 2;
  const workout = workouts.find((w) => w.id === id);

  // Se havia um treino em andamento, ele volta exatamente como estava.
  const [restored, setRestored] = useState(() => Boolean(drafts[id]));
  const [date, setDate] = useState(() => drafts[id]?.date ?? new Date().toISOString());
  const [draft, setDraft] = useState<Record<string, DraftSet[]>>(() => {
    const initial = emptySets(workout, sessions, defaultSets);
    const saved = drafts[id]?.sets ?? {};
    for (const exId of Object.keys(initial)) if (saved[exId]) initial[exId] = saved[exId];
    return initial;
  });

  // O que foi feito da última vez (antes da data escolhida), para servir de referência.
  const previous = useMemo(() => {
    const map: Record<string, { date: string; sets: SetEntry[] } | undefined> = {};
    workout?.exerciseIds.forEach((exId) => (map[exId] = previousRecord(sessions, exId, date)));
    return map;
  }, [workout, sessions, date]);

  // Salva o rascunho automaticamente a cada alteração.
  useEffect(() => {
    const hasValues = Object.values(draft).some((sets) => sets.some((s) => s.weight.trim() || s.reps.trim()));
    if (hasValues || daysAgo(date) !== 0) saveDraft(id, { date, sets: draft });
    else clearDraft(id);
  }, [id, draft, date, saveDraft, clearDraft]);

  if (!workout) {
    return <EmptyState icon="alert-circle-outline" title="Treino não encontrado" text="Ele pode ter sido excluído." />;
  }

  const isToday = daysAgo(date) <= 0;

  function changeDay(delta: number) {
    const next = shiftDays(date, delta);
    setDate(daysAgo(next) <= 0 ? new Date().toISOString() : next);
  }

  function discard() {
    setDraft(emptySets(workout, sessions, defaultSets));
    setDate(new Date().toISOString());
    setRestored(false);
  }

  function setCount(exId: string, count: number) {
    setDraft((d) => {
      const sets = d[exId];
      if (count < 1 || count > MAX_SETS) return d;
      const next =
        count > sets.length
          ? [...sets, ...Array.from({ length: count - sets.length }, () => ({ weight: '', reps: '' }))]
          : sets.slice(0, count);
      return { ...d, [exId]: next };
    });
  }

  function setField(exId: string, index: number, field: keyof DraftSet, value: string) {
    setDraft((d) => ({
      ...d,
      [exId]: d[exId].map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }));
  }

  function repeatLast(exId: string) {
    const prev = previous[exId];
    if (!prev) return;
    setDraft((d) => ({
      ...d,
      [exId]: prev.sets.map((s) => ({ weight: units.weight(s.weight), reps: String(s.reps) })),
    }));
  }

  /** Copia uma série do treino anterior para a mesma série de hoje. */
  function copyPreviousSet(exId: string, index: number) {
    const ref = previous[exId]?.sets[index];
    if (!ref) return;
    setDraft((d) => ({
      ...d,
      [exId]: d[exId].map((s, i) => (i === index ? { weight: units.weight(ref.weight), reps: String(ref.reps) } : s)),
    }));
  }

  /** Compara a série digitada com a mesma série do treino anterior. */
  function compareWithPrevious(set: DraftSet, ref: SetEntry | undefined): 'up' | 'same' | 'down' | null {
    const value = parseNumber(set.weight);
    const reps = parseNumber(set.reps);
    if (!ref || value === null || reps === null) return null;
    const kg = units.toKg(value);
    if (Math.abs(kg - ref.weight) < 0.01) return reps > ref.reps ? 'up' : reps === ref.reps ? 'same' : 'down';
    return kg > ref.weight ? 'up' : 'down';
  }

  function save() {
    const exercises: SessionExercise[] = [];
    for (const exId of workout!.exerciseIds) {
      const sets: SetEntry[] = [];
      for (const [i, s] of draft[exId].entries()) {
        const filledWeight = s.weight.trim() !== '';
        const filledReps = s.reps.trim() !== '';
        if (!filledWeight && !filledReps) continue;
        const weight = parseNumber(s.weight);
        const reps = parseNumber(s.reps);
        if (weight === null || reps === null || reps < 1 || !Number.isInteger(reps)) {
          notify(
            'Confira os valores',
            `${getExercise(exId)?.name}, série ${i + 1}: preencha a carga (${units.unit}) e as repetições (número inteiro).`
          );
          return;
        }
        sets.push({ weight: units.toKg(weight), reps });
      }
      if (sets.length > 0) exercises.push({ exerciseId: exId, sets });
    }

    if (exercises.length === 0) {
      notify('Nada para salvar', 'Preencha a carga e as repetições de pelo menos uma série.');
      return;
    }

    const session = addSession({
      workoutId: workout!.id,
      workoutName: workout!.name,
      date: isToday ? new Date().toISOString() : date,
      exercises,
    });
    clearDraft(id);
    router.replace({ pathname: '/sessao/[id]', params: { id: session.id, novo: '1' } });
  }

  return (
    <>
      <Stack.Screen options={{ title: workout.name }} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets>
        <View style={styles.dateRow}>
          <Pressable
            style={styles.dateBtn}
            onPress={() => changeDay(-1)}
            accessibilityLabel="Dia anterior"
            hitSlop={8}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>
          <View style={styles.dateCenter}>
            <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
            <Text style={styles.dateText}>{formatDayLabel(date)}</Text>
          </View>
          <Pressable
            style={[styles.dateBtn, isToday && { opacity: 0.3 }]}
            onPress={() => changeDay(1)}
            disabled={isToday}
            accessibilityLabel="Próximo dia"
            hitSlop={8}>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </Pressable>
        </View>

        {restored && (
          <View style={styles.restored}>
            <Ionicons name="time-outline" size={16} color={colors.textMuted} />
            <Text style={styles.restoredText}>Treino em andamento restaurado</Text>
            <Pressable onPress={discard} hitSlop={8}>
              <Text style={styles.discard}>Descartar</Text>
            </Pressable>
          </View>
        )}

        {workout.exerciseIds.map((exId) => {
          const exercise = getExercise(exId);
          const prev = previous[exId];
          const sets = draft[exId];
          return (
            <Card key={exId} style={{ gap: 12 }}>
              <View style={styles.exHeader}>
                <ExerciseImage exerciseId={exId} size={52} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.exName}>{exercise?.name ?? 'Exercício removido'}</Text>
                  {prev ? (
                    <View style={styles.prevRow}>
                      <Text style={styles.prev}>Treino anterior: {formatShortDate(prev.date)}</Text>
                      <Pressable hitSlop={8} onPress={() => repeatLast(exId)}>
                        <Text style={styles.repeat}>Repetir tudo</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Text style={styles.prev}>Primeira vez registrando este exercício</Text>
                  )}
                </View>
              </View>

              <View style={styles.counterRow}>
                <Text style={styles.counterLabel}>Séries</Text>
                <View style={styles.counter}>
                  <Pressable
                    style={styles.counterBtn}
                    onPress={() => setCount(exId, sets.length - 1)}
                    accessibilityLabel="Menos uma série">
                    <Ionicons name="remove" size={20} color={colors.text} />
                  </Pressable>
                  <Text style={styles.counterValue}>{sets.length}</Text>
                  <Pressable
                    style={styles.counterBtn}
                    onPress={() => setCount(exId, sets.length + 1)}
                    accessibilityLabel="Mais uma série">
                    <Ionicons name="add" size={20} color={colors.text} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.tableHeader}>
                <Text style={[styles.th, styles.colSet]}>Série</Text>
                {prev && <Text style={[styles.th, styles.colPrev]}>Anterior</Text>}
                <Text style={[styles.th, styles.flex]}>Carga ({units.unit})</Text>
                <Text style={[styles.th, styles.flex]}>Reps</Text>
                {prev && <View style={styles.colTrend} />}
              </View>
              {sets.map((s, i) => {
                const ref = prev?.sets[i];
                const trend = compareWithPrevious(s, ref);
                return (
                  <View key={i} style={styles.setRow}>
                    <Text style={[styles.setNumber, styles.colSet]}>{i + 1}</Text>
                    {prev && (
                      <Pressable
                        style={styles.colPrev}
                        onPress={() => copyPreviousSet(exId, i)}
                        disabled={!ref}
                        accessibilityLabel={ref ? `Copiar série anterior: ${units.set(ref)}` : undefined}>
                        <Text style={styles.prevSet} numberOfLines={1} adjustsFontSizeToFit>
                          {ref ? `${units.weight(ref.weight)} × ${ref.reps}` : '—'}
                        </Text>
                      </Pressable>
                    )}
                    <TextInput
                      style={[styles.input, styles.flex]}
                      value={s.weight}
                      onChangeText={(v) => setField(exId, i, 'weight', v)}
                      keyboardType="decimal-pad"
                      placeholder={ref ? units.weight(ref.weight) : units.unit}
                      placeholderTextColor={colors.textFaint}
                      selectTextOnFocus
                    />
                    <TextInput
                      style={[styles.input, styles.flex]}
                      value={s.reps}
                      onChangeText={(v) => setField(exId, i, 'reps', v)}
                      keyboardType="number-pad"
                      placeholder={ref ? String(ref.reps) : 'reps'}
                      placeholderTextColor={colors.textFaint}
                      selectTextOnFocus
                    />
                    {prev && (
                      <View style={styles.colTrend}>
                        {trend && (
                          <Ionicons
                            name={trend === 'up' ? 'arrow-up' : trend === 'down' ? 'arrow-down' : 'remove'}
                            size={16}
                            color={trend === 'up' ? statusColors.carga : trend === 'down' ? statusColors.regrediu : colors.textFaint}
                          />
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </Card>
          );
        })}

        <Button title="Finalizar e salvar treino" icon="checkmark-done" onPress={save} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
  },
  dateBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  dateCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dateText: { color: colors.text, fontSize: 16, fontWeight: '700' },
  restored: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  restoredText: { color: colors.textMuted, fontSize: 13, flex: 1 },
  discard: { color: colors.danger, fontSize: 13, fontWeight: '700' },
  exHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  exName: { color: colors.text, fontSize: 18, fontWeight: '800' },
  prevRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 4 },
  prev: { color: colors.textMuted, fontSize: 13, flex: 1, lineHeight: 18, marginTop: 4 },
  repeat: { color: colors.primary, fontWeight: '700', fontSize: 13, marginTop: 4 },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counterLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: { color: colors.text, fontSize: 18, fontWeight: '800', minWidth: 32, textAlign: 'center' },
  tableHeader: { flexDirection: 'row', gap: 10 },
  th: { color: colors.textFaint, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  flex: { flex: 1, flexBasis: 0, minWidth: 0 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  setNumber: { color: colors.textMuted, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  colSet: { width: 40, textAlign: 'center' },
  colPrev: { width: 68, justifyContent: 'center' },
  colTrend: { width: 16, alignItems: 'center' },
  prevSet: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  input: {
    backgroundColor: colors.cardAlt,
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
