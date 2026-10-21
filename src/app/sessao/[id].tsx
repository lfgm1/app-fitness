import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EvolutionModal } from '@/components/EvolutionModal';
import { ExerciseImage } from '@/components/ExerciseImage';
import { RecordBurst } from '@/components/RecordBurst';
import { FrankHead } from '@/components/Frank';
import { Button, Card, EmptyState, PRBadge, StatusBadge } from '@/components/ui';
import { useStore } from '@/data/store';
import { confirmAction, formatDateLong } from '@/lib/format';
import { frankProgress } from '@/lib/frank';
import { useUnits } from '@/lib/units';
import { STATUS_INFO, bestSet, compareSets, isPersonalRecord, previousSets } from '@/lib/progress';
import type { ProgressStatus } from '@/lib/progress';
import { colors, fonts, statusColors } from '@/theme';

export default function SessionScreen() {
  const { id, novo } = useLocalSearchParams<{ id: string; novo?: string }>();
  const { sessions, getExercise, deleteSession } = useStore();
  const units = useUnits();
  const session = sessions.find((s) => s.id === id);
  const [evolutionSeen, setEvolutionSeen] = useState(false);

  if (!session) {
    return <EmptyState icon="alert-circle-outline" title="Registro não encontrado" text="Ele pode ter sido excluído." />;
  }

  // O Frank muda de fase quando o total de treinos cruza o início de uma fase (veja lib/frank).
  const phaseNow = frankProgress(sessions.length).current;
  const newPhase = phaseNow.phase !== frankProgress(sessions.length - 1).current.phase ? phaseNow : null;

  const results = session.exercises.map((ex) => ({
    ...ex,
    status: compareSets(previousSets(sessions, ex.exerciseId, session.date), ex.sets),
    isPR: isPersonalRecord(sessions, ex.exerciseId, ex.sets, session.date),
    best: bestSet(ex.sets),
  }));

  const counts = (status: ProgressStatus) => results.filter((r) => r.status === status).length;
  const highlights = (['carga', 'micro'] as const).filter((s) => counts(s) > 0);
  const prCount = results.filter((r) => r.isPR).length;
  const summary = [
    ...(prCount > 0 ? [`${prCount} recorde${prCount === 1 ? '' : 's'} pessoa${prCount === 1 ? 'l' : 'is'}`] : []),
    ...highlights.map((s) => `${counts(s)} ${STATUS_INFO[s].label.toLowerCase()}`),
  ];

  function edit() {
    router.push({ pathname: '/registrar/[id]', params: { id: session!.workoutId, sessao: session!.id } });
  }

  function remove() {
    confirmAction('Excluir registro?', 'Este treino será removido do histórico e dos gráficos.', 'Excluir', () => {
      deleteSession(session!.id);
      router.back();
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={edit} hitSlop={10} accessibilityLabel="Editar treino" style={{ marginRight: 4 }}>
              <Ionicons name="create-outline" size={24} color={colors.text} />
            </Pressable>
          ),
        }}
      />
      {novo === '1' && newPhase && (
        <EvolutionModal
          visible={!evolutionSeen}
          phase={newPhase.phase}
          workoutCount={sessions.length}
          onClose={() => setEvolutionSeen(true)}
        />
      )}

      {novo === '1' && (
        prCount > 0 ? (
          <Card style={styles.prCard}>
            <RecordBurst size="large" label={prCount > 1 ? `${prCount} recordes!` : 'Recorde!'} />
            <Text style={styles.bannerTitle}>Treino salvo</Text>
            <Text style={[styles.bannerText, { textAlign: 'center' }]}>{summary.join(' · ')}</Text>
          </Card>
        ) : (
          <Card style={styles.banner}>
            <FrankHead size={44} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Treino salvo!</Text>
              <Text style={styles.bannerText}>
                {summary.length > 0 ? summary.join(' · ') : 'Continue registrando para acompanhar sua evolução.'}
              </Text>
            </View>
          </Card>
        )
      )}

      <View>
        <Text style={styles.title}>{session.workoutName}</Text>
        <Text style={styles.date}>{formatDateLong(session.date)}</Text>
      </View>

      {results.map((ex) => (
        <Pressable
          key={ex.exerciseId}
          onPress={() => router.push({ pathname: '/exercicio/[id]', params: { id: ex.exerciseId } })}>
          <Card style={[{ gap: 10 }, ex.isPR && { borderColor: colors.bico }]}>
            <View style={styles.exHeader}>
              <ExerciseImage exerciseId={ex.exerciseId} size={40} />
              <Text style={styles.exName}>{getExercise(ex.exerciseId)?.name ?? 'Exercício removido'}</Text>
              {ex.isPR ? <PRBadge /> : <StatusBadge status={ex.status} />}
            </View>
            {ex.sets.map((set, i) => {
              const isRecordSet = ex.isPR && set === ex.best;
              return (
                <View key={i} style={styles.setRow}>
                  <Text style={styles.setLabel}>Série {i + 1}</Text>
                  <View style={styles.setValueRow}>
                    {isRecordSet && <Ionicons name="trophy" size={13} color={colors.bico} />}
                    <Text style={[styles.setValue, isRecordSet && { color: colors.bico }]}>{units.set(set)}</Text>
                  </View>
                </View>
              );
            })}
            <Text style={[styles.statusText, { color: statusColors[ex.status] }]}>
              {STATUS_INFO[ex.status].label} · ver gráfico ›
            </Text>
          </Card>
        </Pressable>
      ))}

      {novo === '1' ? (
        <View style={styles.actions}>
          <Button title="Editar" icon="create-outline" variant="secondary" onPress={edit} style={{ flex: 1 }} />
          <Button
            title="Concluir"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            style={{ flex: 1 }}
          />
        </View>
      ) : (
        <>
          <Button title="Editar treino" icon="create-outline" variant="secondary" onPress={edit} />
          <Button title="Excluir registro" icon="trash-outline" variant="danger" onPress={remove} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 10 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 14, borderColor: colors.crista },
  bannerTitle: { color: colors.text, fontSize: 23, fontFamily: fonts.display, textTransform: 'uppercase', letterSpacing: 0.4 },
  bannerText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14, marginTop: 2, lineHeight: 20 },
  title: { color: colors.text, fontSize: 33, fontFamily: fonts.display, textTransform: 'uppercase', letterSpacing: 0.4 },
  date: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 15, marginTop: 2 },
  exHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  exName: { color: colors.text, fontSize: 17, fontFamily: fonts.bold, flex: 1 },
  setRow: { flexDirection: 'row', justifyContent: 'space-between' },
  setLabel: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 15 },
  setValue: { color: colors.text, fontSize: 15, fontFamily: fonts.mono },
  setValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  prCard: { alignItems: 'center', gap: 6, paddingVertical: 20, borderColor: colors.bico, boxShadow: `4px 4px 0px ${colors.bico}` },
  statusText: { fontSize: 13, fontFamily: fonts.bold, marginTop: 2 },
});
