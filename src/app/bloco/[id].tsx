// Dentro de um bloco: no topo, o próximo treino do bloco (ou o que está em andamento) com o botão de
// registrar; embaixo, a sequência do bloco como uma linha do tempo — os já feitos nesta semana
// (segunda a domingo) com ✓ e a data, e o próximo marcado. Toda segunda as marcas recomeçam.
// Tocando num treino da linha, abre a lista de exercícios dele.

import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ShareTargetSheet } from '@/components/social/ShareTargetSheet';
import { useSharedTraining } from '@/components/social/useSharedTraining';
import { Button, Card, EmptyState } from '@/components/ui';
import { useStore } from '@/data/store';
import type { Session, Workout } from '@/data/store';
import { blockWorkouts, lastDone } from '@/lib/blocks';
import { formatShortDate } from '@/lib/format';
import { colors, fonts, hardShadow, outlineColor } from '@/theme';

/**
 * O próximo do bloco: o seguinte ao treino feito por último dentro do bloco (depois do último,
 * volta para o primeiro).
 */
function nextIndex(list: Workout[], sessions: Session[]) {
  const ids = new Set(list.map((w) => w.id));
  const latest = [...sessions]
    .filter((s) => ids.has(s.workoutId))
    .sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))[0];
  const lastIndex = latest ? list.findIndex((w) => w.id === latest.workoutId) : -1;
  return (lastIndex + 1) % Math.max(1, list.length);
}

/** Segunda-feira desta semana, à meia-noite (as marcas de feito valem de segunda a domingo). */
function startOfWeek(now: Date) {
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
}

function clock() {
  return new Date();
}

/** Duração média dos treinos registrados com duração (minutos), ou null. */
function averageMinutes(sessions: Session[], workoutId: string) {
  const timed = sessions.filter((s) => s.workoutId === workoutId && s.durationMin);
  if (timed.length === 0) return null;
  return Math.round(timed.reduce((sum, s) => sum + (s.durationMin ?? 0), 0) / timed.length);
}

export default function BlockScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { blocks, workouts, sessions, drafts, getExercise } = useStore();
  const { toSharedBlock } = useSharedTraining();
  const [sharing, setSharing] = useState(false);
  // Treino aberto na linha do tempo (mostra os exercícios).
  const [openId, setOpenId] = useState<string | null>(null);
  const block = blocks.find((b) => b.id === id);

  if (!block) {
    return <EmptyState icon="folder-open-outline" title="Bloco não encontrado" text="Ele pode ter sido excluído." />;
  }

  const list = blockWorkouts(block, workouts);
  const next = nextIndex(list, sessions);
  const weekStart = startOfWeek(clock());
  /** Data em que o treino foi feito nesta semana (o mais recente), ou undefined. */
  const doneThisWeek = (workoutId: string) =>
    sessions
      .filter((s) => s.workoutId === workoutId && new Date(s.date) >= weekStart)
      .map((s) => s.date)
      .sort()
      .at(-1);
  // Treino em andamento do bloco vem antes do "próximo".
  const inProgress = list.find((w) => drafts[w.id]);
  const featured = inProgress ?? list[next];
  const featuredIndex = featured ? list.indexOf(featured) : -1;
  const featuredLast = featured ? lastDone(sessions, featured.id) : undefined;
  const featuredMinutes = featured ? averageMinutes(sessions, featured.id) : null;
  const register = (workoutId: string) => router.push({ pathname: '/registrar/[id]', params: { id: workoutId } });

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: block.name }} />
      <View style={styles.header}>
        <View style={styles.icon}>
          <Text style={styles.emoji}>{block.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{block.name}</Text>
          <Text style={styles.meta}>
            {list.length} treino{list.length === 1 ? '' : 's'}
          </Text>
        </View>
      </View>

      {list.length === 0 && (
        <Text style={styles.meta}>
          Este bloco ainda não tem treinos. Adicione os treinos que já existem ou crie um novo.
        </Text>
      )}

      {featured && (
        <Card style={styles.featured}>
          <Text style={styles.featuredTag}>{inProgress ? '● EM ANDAMENTO' : 'PRÓXIMO'}</Text>
          <Text style={styles.featuredName}>
            {featuredIndex + 1} · {featured.name}
          </Text>
          <Text style={styles.meta}>
            {featured.exerciseIds.length} exercício{featured.exerciseIds.length === 1 ? '' : 's'}
            {featuredMinutes ? ` · ~${featuredMinutes} min` : ''}
            {featuredLast ? ` · último em ${formatShortDate(featuredLast)}` : ' · nunca feito'}
          </Text>
          <Text style={styles.preview} numberOfLines={2}>
            {featured.exerciseIds.map((exId) => getExercise(exId)?.name ?? 'Exercício removido').join(' · ')}
          </Text>
          <Button
            title={inProgress ? 'Continuar treino' : 'Registrar treino'}
            icon={inProgress ? 'time-outline' : 'play'}
            onPress={() => register(featured.id)}
          />
        </Card>
      )}

      {list.length > 0 && (
        <View style={styles.timeline}>
          {list.map((workout, index) => {
            const isNext = workout.id === featured?.id;
            const last = lastDone(sessions, workout.id);
            const doneDate = doneThisWeek(workout.id);
            const done = Boolean(doneDate);
            const open = openId === workout.id;
            const isLast = index === list.length - 1;
            return (
              <View key={workout.id} style={styles.step}>
                {/* Bolinha e linha da linha do tempo */}
                <View style={styles.rail}>
                  <View style={[styles.dot, done && styles.dotDone, isNext && styles.dotNext]}>
                    {done && <Ionicons name="checkmark" size={13} color={colors.primaryText} />}
                  </View>
                  {!isLast && <View style={[styles.line, done && { backgroundColor: colors.primary }]} />}
                </View>
                <View style={styles.stepBody}>
                  <Pressable
                    onPress={() => setOpenId(open ? null : workout.id)}
                    style={styles.stepTop}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: open }}
                    accessibilityLabel={`${index + 1} ${workout.name}. ${open ? 'Fechar' : 'Ver exercícios'}`}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.stepName, isNext && { color: colors.primary }]}>
                        {index + 1} · {workout.name}
                      </Text>
                      <Text style={styles.stepMeta}>
                        {drafts[workout.id]
                          ? 'em andamento'
                          : doneDate
                            ? `feito em ${formatShortDate(doneDate)}`
                            : isNext
                              ? 'próximo'
                              : last
                                ? `último em ${formatShortDate(last)}`
                                : 'nunca feito'}
                      </Text>
                    </View>
                    <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
                  </Pressable>
                  {open && (
                    <View style={styles.detail}>
                      {workout.exerciseIds.map((exId, i) => (
                        <View key={exId} style={styles.exercise}>
                          <Text style={styles.number}>{i + 1}</Text>
                          <Text style={styles.exerciseName} numberOfLines={1}>
                            {getExercise(exId)?.name ?? 'Exercício removido'}
                          </Text>
                        </View>
                      ))}
                      <View style={styles.detailActions}>
                        <Button
                          title={drafts[workout.id] ? 'Continuar' : 'Registrar'}
                          icon="play"
                          small
                          style={{ flex: 1 }}
                          onPress={() => register(workout.id)}
                        />
                        <Button
                          title="Editar"
                          icon="create-outline"
                          variant="secondary"
                          small
                          style={{ flex: 1 }}
                          onPress={() => router.push({ pathname: '/treino/editar', params: { id: workout.id } })}
                        />
                      </View>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      <Button
        title="Criar treino neste bloco"
        icon="add"
        variant="secondary"
        onPress={() => router.push({ pathname: '/treino/editar', params: { bloco: block.id } })}
      />
      <View style={styles.actions}>
        <Button
          title="Editar bloco"
          icon="create-outline"
          variant="secondary"
          style={{ flex: 1 }}
          onPress={() => router.push({ pathname: '/bloco/editar', params: { id: block.id } })}
        />
        <Button
          title="Compartilhar"
          icon="share-social-outline"
          variant="secondary"
          style={{ flex: 1 }}
          onPress={() => setSharing(true)}
          disabled={list.length === 0}
        />
      </View>

      <ShareTargetSheet visible={sharing} onClose={() => setSharing(false)} content={{ block: toSharedBlock(block) }} />
    </ScrollView>
  );
}

const DOT = 22;

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 2 },
  icon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: colors.cardAlt,
    borderWidth: 2.5,
    borderColor: outlineColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 30 },
  name: { color: colors.text, fontFamily: fonts.display, fontSize: 32, textTransform: 'uppercase', letterSpacing: 0.4 },
  meta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  featured: { gap: 8, borderColor: colors.primary, ...hardShadow(outlineColor) },
  featuredTag: { color: colors.primary, fontFamily: fonts.bold, fontSize: 12, letterSpacing: 0.8 },
  featuredName: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 30,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  preview: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, marginBottom: 4 },
  timeline: { paddingLeft: 4 },
  step: { flexDirection: 'row', gap: 12 },
  rail: { width: DOT, alignItems: 'center' },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  dotDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  dotNext: { borderColor: colors.primary, borderWidth: 3 },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 2 },
  stepBody: { flex: 1, paddingBottom: 18 },
  stepTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepName: { color: colors.text, fontFamily: fonts.bold, fontSize: 16 },
  stepMeta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, marginTop: 1 },
  detail: { gap: 8, marginTop: 10 },
  exercise: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  number: { color: colors.textFaint, fontFamily: fonts.mono, fontSize: 13, width: 16, textAlign: 'right' },
  exerciseName: { flex: 1, color: colors.text, fontFamily: fonts.semibold, fontSize: 14 },
  detailActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10 },
});
