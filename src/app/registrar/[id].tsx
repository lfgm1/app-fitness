import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, Vibration, View } from 'react-native';

import { ExerciseImage } from '@/components/ExerciseImage';
import { ExercisePicker } from '@/components/ExercisePicker';
import { RecordBurst } from '@/components/RecordBurst';
import { RestControls } from '@/components/rest/RestControls';
import { Button, Card, EmptyState } from '@/components/ui';
import { isTimedExercise } from '@/data/exercises';
import { useProfile } from '@/data/profile';
import { useStore } from '@/data/store';
import type { DraftSet, Session, SessionExercise, SetEntry, Workout } from '@/data/store';
import {
  daysAgo,
  formatDayLabel,
  formatDuration,
  formatShortDate,
  notify,
  parseDuration,
  parseNumber,
  shiftDays,
} from '@/lib/format';
import { beatsSet, bestSet, previousRecord, previousSets, recordBefore } from '@/lib/progress';
import { clearFlap } from '@/lib/frankFlap';
import { useUnits } from '@/lib/units';
import { colors, fonts, outline, outlineColor, statusColors } from '@/theme';

const MAX_SETS = 12;
/** Contagem regressiva antes do timer começar, para dar tempo de se posicionar. */
const COUNTDOWN_MS = 3000;

/** Timer de uma série de um exercício de tempo (ex: prancha). */
type RunningTimer = { exId: string; index: number; startedAt: number };

/** Hora atual em milissegundos (usada só pelo timer, fora da renderização). */
function clock() {
  return Date.now();
}

/** Séries em branco para um exercício (mesma quantidade da última vez, ou o padrão). */
function blankSets(exId: string, sessions: Session[], defaultSets: number): DraftSet[] {
  const count = previousSets(sessions, exId)?.length ?? defaultSets;
  return Array.from({ length: count }, () => ({ weight: '', reps: '' }));
}

function emptySets(exerciseIds: string[], sessions: Session[], defaultSets: number) {
  return Object.fromEntries(exerciseIds.map((exId) => [exId, blankSets(exId, sessions, defaultSets)]));
}

/**
 * Registrar um treino novo ou, com o parâmetro "sessao", editar um treino já registrado.
 */
export default function LogWorkoutScreen() {
  const { id, sessao } = useLocalSearchParams<{
    id: string;
    sessao?: string;
  }>();
  const {
    workouts,
    sessions: allSessions,
    drafts,
    getExercise,
    addSession,
    updateSession,
    saveDraft,
    clearDraft,
  } = useStore();
  const { profile } = useProfile();
  const units = useUnits();
  const defaultSets = profile?.defaultSets ?? 2;

  const isEdit = Boolean(sessao);
  const editing = isEdit ? allSessions.find((s) => s.id === sessao) : undefined;
  // Ao editar, o próprio treino não conta como "treino anterior" na comparação.
  const sessions = useMemo(
    () => (isEdit ? allSessions.filter((s) => s.id !== sessao) : allSessions),
    [allSessions, isEdit, sessao]
  );
  // Ao editar, os exercícios vêm do treino registrado (o treino montado pode ter mudado ou sido excluído).
  const workout = useMemo<Workout | undefined>(
    () =>
      editing
        ? {
            id: editing.workoutId,
            name: editing.workoutName,
            exerciseIds: editing.exercises.map((e) => e.exerciseId),
            createdAt: editing.date,
          }
        : workouts.find((w) => w.id === id),
    [editing, workouts, id]
  );

  // Se havia um treino em andamento, ele volta exatamente como estava.
  const [restored, setRestored] = useState(() => !isEdit && Boolean(drafts[id]));
  const [date, setDate] = useState(() => editing?.date ?? drafts[id]?.date ?? new Date().toISOString());
  // Mudanças só deste dia: exercícios extras e exercícios pulados. O treino montado não muda.
  const [extraIds, setExtraIds] = useState<string[]>(() => (isEdit ? [] : (drafts[id]?.extraIds ?? [])));
  const [skippedIds, setSkippedIds] = useState<string[]>(() => (isEdit ? [] : (drafts[id]?.skippedIds ?? [])));
  const [pickerOpen, setPickerOpen] = useState(false);
  const baseIds = useMemo(() => workout?.exerciseIds ?? [], [workout]);
  const exerciseIds = useMemo(() => [...baseIds, ...extraIds], [baseIds, extraIds]);
  // Exercícios abertos. Começa só com o primeiro (os outros minimizados); toque no nome abre/fecha.
  const [expanded, setExpanded] = useState<string[] | null>(null);
  const firstOpen = exerciseIds.find((x) => !skippedIds.includes(x));
  const openIds = expanded ?? (firstOpen ? [firstOpen] : []);
  function toggleOpen(exId: string) {
    setExpanded(openIds.includes(exId) ? openIds.filter((x) => x !== exId) : [...openIds, exId]);
  }

  // Nos exercícios de tempo, o campo "reps" do rascunho guarda o tempo digitado ("0:45").
  function toDraft(set: SetEntry): DraftSet {
    if (set.seconds !== undefined) return { weight: '', reps: formatDuration(set.seconds) };
    return { weight: units.weight(set.weight), reps: String(set.reps) };
  }

  const [draft, setDraft] = useState<Record<string, DraftSet[]>>(() => {
    if (editing) {
      return Object.fromEntries(editing.exercises.map((e) => [e.exerciseId, e.sets.map(toDraft)]));
    }
    const initial = emptySets(exerciseIds, sessions, defaultSets);
    const saved = drafts[id]?.sets ?? {};
    for (const exId of Object.keys(initial)) if (saved[exId]) initial[exId] = saved[exId];
    return initial;
  });

  // O que foi feito da última vez (antes da data escolhida), para servir de referência.
  const previous = useMemo(() => {
    const map: Record<string, { date: string; sets: SetEntry[] } | undefined> = {};
    exerciseIds.forEach((exId) => (map[exId] = previousRecord(sessions, exId, date)));
    return map;
  }, [exerciseIds, sessions, date]);

  // O recorde pessoal de cada exercício (melhor série de todos os treinos antes desta data).
  const records = useMemo(() => {
    const map: Record<string, SetEntry | undefined> = {};
    exerciseIds.forEach((exId) => (map[exId] = recordBefore(sessions, exId, date)));
    return map;
  }, [exerciseIds, sessions, date]);

  // Salva o rascunho automaticamente a cada alteração (não ao editar um treino já registrado).
  useEffect(() => {
    if (isEdit) return;
    const hasValues = Object.values(draft).some((sets) => sets.some((s) => s.weight.trim() || s.reps.trim()));
    if (hasValues || daysAgo(date) !== 0 || extraIds.length > 0 || skippedIds.length > 0)
      saveDraft(id, { date, sets: draft, extraIds, skippedIds });
    else clearDraft(id);
  }, [id, isEdit, draft, date, extraIds, skippedIds, saveDraft, clearDraft]);

  // Timer dos exercícios de tempo. O tempo é calculado a partir da hora de início,
  // então continua certo mesmo se o celular bloquear ou a pessoa trocar de app.
  const [timer, setTimer] = useState<RunningTimer | null>(null);
  const [now, setNow] = useState(clock);
  const vibrated = useRef({ start: false, record: false });

  useEffect(() => {
    if (!timer) return;
    vibrated.current = { start: false, record: false };
    const tag = 'set-timer';
    activateKeepAwakeAsync(tag).catch(() => {});
    const interval = setInterval(() => setNow(clock()), 200);
    return () => {
      clearInterval(interval);
      deactivateKeepAwake(tag).catch(() => {});
    };
  }, [timer]);

  // Vibra quando a contagem termina e quando o tempo passa do recorde.
  useEffect(() => {
    if (!timer) return;
    const elapsed = now - timer.startedAt;
    if (elapsed >= 0 && !vibrated.current.start) {
      vibrated.current.start = true;
      Vibration.vibrate(150);
    }
    const recordSeconds = recordBefore(sessions, timer.exId, date)?.seconds;
    if (recordSeconds !== undefined && elapsed / 1000 > recordSeconds && !vibrated.current.record) {
      vibrated.current.record = true;
      Vibration.vibrate([0, 200, 100, 200]);
    }
  }, [now, timer, sessions, date]);

  if (!workout) {
    return (
      <EmptyState
        icon="alert-circle-outline"
        title={isEdit ? 'Registro não encontrado' : 'Treino não encontrado'}
        text="Ele pode ter sido excluído."
      />
    );
  }

  const isToday = daysAgo(date) <= 0;

  function changeDay(delta: number) {
    const next = shiftDays(date, delta);
    setDate(daysAgo(next) <= 0 ? new Date().toISOString() : next);
  }

  function discard() {
    clearFlap(id);
    setDraft(emptySets(baseIds, sessions, defaultSets));
    setExtraIds([]);
    setSkippedIds([]);
    setDate(new Date().toISOString());
    setRestored(false);
  }

  function toggleSkip(exId: string) {
    setSkippedIds((ids) => (ids.includes(exId) ? ids.filter((x) => x !== exId) : [...ids, exId]));
  }

  function addExtra(exId: string) {
    // Exercício extra já entra aberto.
    setExpanded([...openIds, exId]);
    setExtraIds((ids) => [...ids, exId]);
    setDraft((d) => (d[exId] ? d : { ...d, [exId]: blankSets(exId, sessions, defaultSets) }));
  }

  function removeExtra(exId: string) {
    setExtraIds((ids) => ids.filter((x) => x !== exId));
    setDraft((d) => {
      const next = { ...d };
      delete next[exId];
      return next;
    });
  }

  /** No seletor, marcado = vai fazer hoje. Desmarcar um exercício do treino montado é o mesmo que pular. */
  function togglePicked(exId: string) {
    if (extraIds.includes(exId)) removeExtra(exId);
    else if (baseIds.includes(exId)) toggleSkip(exId);
    else addExtra(exId);
  }

  /** Segundos já cronometrados no timer (negativo durante a contagem regressiva). */
  function timerSeconds(t: RunningTimer) {
    return (now - t.startedAt) / 1000;
  }

  function stopTimer() {
    if (!timer) return;
    const seconds = Math.floor(timerSeconds(timer));
    // Parar durante a contagem regressiva só cancela.
    if (seconds > 0) setField(timer.exId, timer.index, 'reps', formatDuration(seconds));
    setTimer(null);
  }

  function startTimer(exId: string, index: number) {
    stopTimer();
    const start = clock();
    setNow(start);
    setTimer({ exId, index, startedAt: start + COUNTDOWN_MS });
  }

  function setCount(exId: string, count: number) {
    setDraft((d) => {
      const sets = d[exId];
      if (count < 1 || count > MAX_SETS) return d;
      const next =
        count > sets.length
          ? [
              ...sets,
              ...Array.from({ length: count - sets.length }, () => ({
                weight: '',
                reps: '',
              })),
            ]
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
      [exId]: prev.sets.map(toDraft),
    }));
  }

  /** Copia uma série do treino anterior para a mesma série de hoje. */
  function copyPreviousSet(exId: string, index: number) {
    const ref = previous[exId]?.sets[index];
    if (!ref) return;
    setDraft((d) => ({
      ...d,
      [exId]: d[exId].map((s, i) => (i === index ? toDraft(ref) : s)),
    }));
  }

  /** Compara a série digitada com a mesma série do treino anterior. */
  function compareWithPrevious(
    set: DraftSet,
    ref: SetEntry | undefined,
    timed: boolean
  ): 'up' | 'same' | 'down' | null {
    if (timed) {
      const seconds = parseDuration(set.reps);
      if (!ref || ref.seconds === undefined || seconds === null) return null;
      return seconds > ref.seconds ? 'up' : seconds === ref.seconds ? 'same' : 'down';
    }
    const value = parseNumber(set.weight);
    const reps = parseNumber(set.reps);
    if (!ref || value === null || reps === null) return null;
    const kg = units.toKg(value);
    if (Math.abs(kg - ref.weight) < 0.01) return reps > ref.reps ? 'up' : reps === ref.reps ? 'same' : 'down';
    return kg > ref.weight ? 'up' : 'down';
  }

  /** A série digitada, se estiver completa e válida. */
  function typedSet(set: DraftSet, timed: boolean): SetEntry | null {
    if (timed) {
      const seconds = parseDuration(set.reps);
      return seconds !== null && seconds > 0 ? { weight: 0, reps: 0, seconds } : null;
    }
    const value = parseNumber(set.weight);
    const reps = parseNumber(set.reps);
    if (value === null || reps === null || reps < 1) return null;
    return { weight: units.toKg(value), reps };
  }

  /** A melhor série digitada, se ela bate o recorde pessoal. */
  function newRecord(exId: string): SetEntry | null {
    const record = records[exId];
    const timed = isTimedExercise(exId);
    const typed = (draft[exId] ?? []).map((s) => typedSet(s, timed)).filter((s): s is SetEntry => s !== null);
    // Enquanto o timer corre, o tempo que está passando também conta.
    if (timer?.exId === exId && timerSeconds(timer) >= 1) {
      typed.push({
        weight: 0,
        reps: 0,
        seconds: Math.floor(timerSeconds(timer)),
      });
    }
    if (!record || typed.length === 0) return null;
    const best = bestSet(typed);
    return beatsSet(best, record) ? best : null;
  }

  function save() {
    if (timer) {
      notify('Timer ligado', 'Pare o timer antes de salvar o treino.');
      return;
    }
    const exercises: SessionExercise[] = [];
    for (const exId of exerciseIds) {
      if (skippedIds.includes(exId)) continue;
      const sets: SetEntry[] = [];
      const timed = isTimedExercise(exId);
      for (const [i, s] of draft[exId].entries()) {
        if (timed) {
          if (!s.reps.trim()) continue;
          const seconds = parseDuration(s.reps);
          if (seconds === null || seconds < 1) {
            notify(
              'Confira os valores',
              `${getExercise(exId)?.name}, série ${i + 1}: digite o tempo como 0:45 ou 1:10.`
            );
            return;
          }
          sets.push({ weight: 0, reps: 0, seconds });
          continue;
        }
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
      notify(
        'Nada para salvar',
        isEdit
          ? 'Preencha pelo menos uma série. Para apagar este treino, use "Excluir registro".'
          : 'Preencha a carga e as repetições de pelo menos uma série.'
      );
      return;
    }

    if (editing) {
      updateSession(editing.id, { date, exercises });
      router.back();
      return;
    }

    const session = addSession({
      workoutId: workout!.id,
      workoutName: workout!.name,
      date: isToday ? new Date().toISOString() : date,
      exercises,
    });
    clearDraft(id);
    clearFlap(id);
    router.replace({
      pathname: '/sessao/[id]',
      params: { id: session.id, novo: '1' },
    });
  }

  return (
    <>
      <Stack.Screen options={{ title: isEdit ? 'Editar treino' : workout.name }} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets>
        <View style={styles.dateRow}>
          <Pressable style={styles.dateBtn} onPress={() => changeDay(-1)} accessibilityLabel="Dia anterior" hitSlop={8}>
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

        {exerciseIds.map((exId) => {
          const exercise = getExercise(exId);
          const prev = previous[exId];
          const sets = draft[exId];
          const isExtra = extraIds.includes(exId);
          const record = records[exId];
          const beaten = newRecord(exId);
          const timed = isTimedExercise(exId);

          if (skippedIds.includes(exId)) {
            return (
              <Card key={exId} style={styles.skippedCard}>
                <ExerciseImage exerciseId={exId} size={36} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.skippedName} numberOfLines={1}>
                    {exercise?.name ?? 'Exercício removido'}
                  </Text>
                  <Text style={styles.tag}>Pulado {isEdit ? 'neste registro' : 'hoje'}</Text>
                </View>
                <Pressable onPress={() => toggleSkip(exId)} hitSlop={8}>
                  <Text style={styles.repeat}>Voltar</Text>
                </Pressable>
              </Card>
            );
          }

          const isOpen = openIds.includes(exId);
          if (!isOpen) {
            // Minimizado: foto, nome e um resumo. Toque para abrir.
            const filled = sets.filter((x) => x.weight.trim() || x.reps.trim()).length;
            return (
              <Pressable key={exId} onPress={() => toggleOpen(exId)} accessibilityRole="button">
                <Card style={styles.collapsedCard}>
                  <ExerciseImage exerciseId={exId} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.collapsedName} numberOfLines={1}>
                      {exercise?.name ?? 'Exercício removido'}
                    </Text>
                    <Text style={styles.prev}>
                      {sets.length} série{sets.length === 1 ? '' : 's'}
                      {filled > 0 ? ` · ${filled} preenchida${filled === 1 ? '' : 's'}` : ''}
                    </Text>
                  </View>
                  {filled > 0 && filled === sets.length && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                  <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
                </Card>
              </Pressable>
            );
          }

          return (
            <Card key={exId} style={{ gap: 12 }}>
              <View style={styles.exHeader}>
                <Pressable onPress={() => toggleOpen(exId)} accessibilityLabel={`Minimizar ${exercise?.name}`}>
                  <ExerciseImage exerciseId={exId} size={52} />
                </Pressable>
                <Pressable style={{ flex: 1 }} onPress={() => toggleOpen(exId)}>
                  {isExtra && (
                    <Text style={[styles.tag, { color: colors.primary }]}>{isEdit ? 'Extra' : 'Extra · só hoje'}</Text>
                  )}
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
                </Pressable>
                <Pressable
                  style={styles.skipBtn}
                  onPress={() => (isExtra ? removeExtra(exId) : toggleSkip(exId))}
                  hitSlop={6}
                  accessibilityLabel={isExtra ? `Tirar ${exercise?.name}` : `Pular ${exercise?.name}`}>
                  <Ionicons name={isExtra ? 'close' : 'play-skip-forward'} size={14} color={colors.textMuted} />
                  <Text style={styles.skipText}>{isExtra ? 'Tirar' : 'Pular'}</Text>
                </Pressable>
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
                {timed ? (
                  <>
                    <Text style={[styles.th, styles.flex]}>Tempo</Text>
                    <View style={styles.colPlay} />
                  </>
                ) : (
                  <>
                    <Text style={[styles.th, styles.flex]}>Carga ({units.unit})</Text>
                    <Text style={[styles.th, styles.flex]}>Reps</Text>
                  </>
                )}
                {prev && <View style={styles.colTrend} />}
              </View>
              {sets.map((s, i) => {
                const ref = prev?.sets[i];
                const trend = compareWithPrevious(s, ref, timed);
                const typed = typedSet(s, timed);
                const running = timer?.exId === exId && timer.index === i ? timer : null;
                const runningSeconds = running ? timerSeconds(running) : 0;
                const isRecord =
                  beaten !== null &&
                  ((running && runningSeconds >= 1 && Math.floor(runningSeconds) === beaten.seconds) ||
                    (!running && typed !== null && !beatsSet(beaten, typed)));
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
                          {ref ? (timed ? units.set(ref) : `${units.weight(ref.weight)} × ${ref.reps}`) : '—'}
                        </Text>
                      </Pressable>
                    )}
                    {timed ? (
                      <>
                        {running ? (
                          <View style={[styles.input, styles.flex, styles.timerRunning]}>
                            <Text style={styles.timerText}>
                              {runningSeconds < 0 ? Math.ceil(-runningSeconds) : formatDuration(runningSeconds)}
                            </Text>
                          </View>
                        ) : (
                          <TextInput
                            style={[styles.input, styles.flex]}
                            value={s.reps}
                            onChangeText={(v) => setField(exId, i, 'reps', v)}
                            keyboardType="numbers-and-punctuation"
                            placeholder={ref ? units.set(ref) : '0:00'}
                            placeholderTextColor={colors.textFaint}
                            selectTextOnFocus
                          />
                        )}
                        <Pressable
                          style={[styles.playBtn, running && styles.stopBtn]}
                          onPress={() => (running ? stopTimer() : startTimer(exId, i))}
                          hitSlop={6}
                          accessibilityLabel={running ? 'Parar timer' : `Iniciar timer da série ${i + 1}`}>
                          <Ionicons
                            name={running ? 'stop' : 'play'}
                            size={20}
                            color={running ? colors.text : colors.primaryText}
                          />
                        </Pressable>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
                    {prev && (
                      <View style={styles.colTrend}>
                        {isRecord ? (
                          <Ionicons name="trophy" size={15} color={colors.bico} />
                        ) : (
                          trend && (
                            <Ionicons
                              name={trend === 'up' ? 'arrow-up' : trend === 'down' ? 'arrow-down' : 'remove'}
                              size={16}
                              color={
                                trend === 'up'
                                  ? statusColors.carga
                                  : trend === 'down'
                                    ? statusColors.regrediu
                                    : colors.textFaint
                              }
                            />
                          )
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
              {beaten && record && (
                <View style={styles.prBanner}>
                  <RecordBurst />
                  <Text style={styles.prBannerText}>Novo recorde pessoal</Text>
                  <Text style={styles.prBannerOld}>antes: {units.set(record)}</Text>
                </View>
              )}
            </Card>
          );
        })}

        <Pressable style={styles.addExtra} onPress={() => setPickerOpen(true)}>
          <Ionicons name="add" size={20} color={colors.primary} />
          <Text style={styles.addExtraText}>Adicionar exercício extra</Text>
        </Pressable>
        <Text style={styles.hint}>
          Pular ou adicionar aqui vale só para {isEdit ? 'este registro' : 'hoje'}. O treino montado não muda.
        </Text>

        <Button
          title={isEdit ? 'Salvar alterações' : 'Finalizar e salvar treino'}
          icon="checkmark-done"
          onPress={save}
        />
      </ScrollView>
      <ExercisePicker
        visible={pickerOpen}
        selectedIds={exerciseIds.filter((x) => !skippedIds.includes(x))}
        onToggle={togglePicked}
        onClose={() => setPickerOpen(false)}
      />
      {/* Descanso com o Frank Flap (só ao registrar um treino novo) */}
      {!isEdit && <RestControls workoutId={id} />}
    </>
  );
}

const styles = StyleSheet.create({
  // Espaço embaixo para o botão de descanso não cobrir o último exercício.
  content: { padding: 16, gap: 12, paddingBottom: 110 },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    ...outline,
    padding: 4,
  },
  dateBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  dateCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dateText: { color: colors.text, fontSize: 16, fontFamily: fonts.bold },
  restored: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  restoredText: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 13,
    flex: 1,
  },
  discard: { color: colors.danger, fontSize: 13, fontFamily: fonts.bold },
  exHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  collapsedCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  collapsedName: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  skipBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.cardAlt,
    borderWidth: 2,
    borderColor: outlineColor,
  },
  skipText: {
    color: colors.textMuted,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  skippedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    opacity: 0.6,
  },
  skippedName: {
    color: colors.textMuted,
    fontSize: 18,
    fontFamily: fonts.display,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tag: {
    color: colors.textMuted,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  addExtra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2.5,
    borderStyle: 'dashed',
    borderColor: outlineColor,
  },
  addExtraText: { color: colors.primary, fontFamily: fonts.bold, fontSize: 15 },
  hint: {
    color: colors.textFaint,
    fontFamily: fonts.regular,
    fontSize: 12,
    textAlign: 'center',
    marginTop: -4,
  },
  exName: {
    color: colors.text,
    fontSize: 23,
    fontFamily: fonts.display,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  prevRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 4,
  },
  prev: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
    marginTop: 4,
  },
  repeat: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: 13,
    marginTop: 4,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counterLabel: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.semibold,
  },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.cardAlt,
    borderWidth: 2,
    borderColor: outlineColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: {
    color: colors.text,
    fontSize: 23,
    fontFamily: fonts.display,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    minWidth: 32,
    textAlign: 'center',
  },
  tableHeader: { flexDirection: 'row', gap: 10 },
  th: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.semibold,
  },
  flex: { flex: 1, flexBasis: 0, minWidth: 0 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  setNumber: {
    color: colors.textMuted,
    fontSize: 16,
    fontFamily: fonts.bold,
    textAlign: 'center',
  },
  colSet: { width: 40, textAlign: 'center' },
  colPrev: { width: 68, justifyContent: 'center' },
  colTrend: { width: 16, alignItems: 'center' },
  colPlay: { width: 44 },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: outlineColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopBtn: { backgroundColor: colors.danger },
  timerRunning: { borderColor: colors.primary, justifyContent: 'center' },
  timerText: {
    color: colors.primary,
    fontFamily: fonts.mono,
    fontSize: 20,
    textAlign: 'center',
  },
  prBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 4,
  },
  prBannerText: {
    color: colors.bico,
    fontFamily: fonts.bold,
    fontSize: 14,
    flex: 1,
  },
  prBannerOld: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 12,
  },
  prevSet: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.mono,
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
    fontFamily: fonts.mono,
    textAlign: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    ...outline,
  },
});
