import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BLOCK_COLORS, BlockChart } from '@/components/BlockChart';
import { ExerciseImage } from '@/components/ExerciseImage';
import { TimeBarChart } from '@/components/TimeBarChart';
import { Card, EmptyState, PRBadge, SectionTitle, StatusBadge } from '@/components/ui';
import { useStore } from '@/data/store';
import { formatDate, formatDateLong } from '@/lib/format';
import { useUnits } from '@/lib/units';
import { isTimedExercise } from '@/data/exercises';
import { STATUS_INFO, beatsSet, exerciseHistory, setMetric } from '@/lib/progress';
import type { ProgressStatus } from '@/lib/progress';
import { colors, fonts, statusColors } from '@/theme';

const LEGEND: ProgressStatus[] = ['carga', 'micro', 'manteve', 'regrediu'];

export default function ExerciseProgressScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sessions, getExercise } = useStore();
  const units = useUnits();
  const exercise = getExercise(id);
  const history = exerciseHistory(sessions, id);
  const [selected, setSelected] = useState(history.length - 1);

  if (history.length === 0) {
    return (
      <>
        <Stack.Screen options={{ title: exercise?.name ?? 'Progressão' }} />
        <EmptyState icon="trending-up-outline" title="Sem registros" text="Registre este exercício para ver o gráfico." />
      </>
    );
  }

  const first = history[0];
  const last = history.at(-1)!;
  const timed = isTimedExercise(id);
  const record = history.reduce((best, h) => (beatsSet(h.best, best.best) ? h : best));
  const diff = setMetric(last.best) - setMetric(first.best);
  const pct = setMetric(first.best) > 0 ? Math.round((diff / setMetric(first.best)) * 100) : 0;
  const loadUps = history.filter((h) => h.status === 'carga').length;
  const microUps = history.filter((h) => h.status === 'micro').length;
  const point = history[Math.min(selected, history.length - 1)];

  return (
    <>
      <Stack.Screen options={{ title: 'Progressão' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <ExerciseImage exerciseId={id} size={72} />
          <View style={{ flex: 1 }}>
            <Text style={styles.heroName}>{exercise?.name ?? 'Exercício removido'}</Text>
            {exercise && <Text style={styles.heroGroup}>{exercise.group}</Text>}
          </View>
        </View>

        <View style={styles.statsRow}>
          <Stat label="Atual" value={units.set(last.best)} />
          <Stat label="Recorde" value={units.set(record.best)} color={colors.crista} />
          <Stat
            label="Evolução"
            value={units.delta(first.best, last.best) || (timed ? '0s' : `0${units.unit}`)}
            sub={history.length > 1 ? `${pct >= 0 ? '+' : ''}${pct}%` : undefined}
            color={diff > 0 ? statusColors.carga : diff < 0 ? statusColors.regrediu : undefined}
          />
        </View>

        <Card style={{ gap: 8 }}>
          <Text style={styles.chartTitle}>{timed ? 'Maior tempo por treino' : 'Carga máxima por treino'}</Text>
          {timed ? (
            <TimeBarChart entries={history} selectedIndex={selected} onSelect={setSelected} />
          ) : (
            <BlockChart entries={history} selectedIndex={selected} onSelect={setSelected} />
          )}
          <View style={styles.legend}>
            {LEGEND.filter((s) => !timed || s !== 'micro').map((s) => (
              <View key={s} style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: BLOCK_COLORS[s] }]} />
                <Text style={styles.legendText}>{timed && s === 'carga' ? 'Mais tempo' : STATUS_INFO[s].label}</Text>
              </View>
            ))}
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: colors.bico }]} />
              <Text style={styles.legendText}>Recorde</Text>
            </View>
          </View>
        </Card>

        <Card style={[styles.detail, { borderColor: statusColors[point.status] }]}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailDate}>{formatDateLong(point.date)}</Text>
            {point.isPR ? <PRBadge /> : <StatusBadge status={point.status} timed={timed} />}
          </View>
          <Text style={styles.detailSets}>{point.sets.map(units.set).join('  ·  ')}</Text>
        </Card>

        <View style={styles.statsRow}>
          <Stat label={timed ? 'Vezes que aumentou' : 'Progressões de carga'} value={String(loadUps)} color={statusColors.carga} />
          {!timed && <Stat label="Micro progressões" value={String(microUps)} color={statusColors.micro} />}
          <Stat label="Treinos" value={String(history.length)} />
        </View>

        <SectionTitle>Histórico</SectionTitle>
        {[...history].reverse().map((h) => {
          const index = history.indexOf(h);
          return (
            <Pressable key={h.sessionId} onPress={() => setSelected(index)}>
              <Card style={[styles.histRow, index === selected && { borderColor: colors.primary }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.histDate}>{formatDate(h.date)}</Text>
                  <Text style={styles.histSets}>{h.sets.map(units.set).join(' · ')}</Text>
                </View>
                {h.isPR ? <PRBadge /> : <StatusBadge status={h.status} timed={timed} />}
              </Card>
            </Pressable>
          );
        })}
      </ScrollView>
    </>
  );
}

function Stat({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <Card style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color ? { color } : null]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroName: { color: colors.text, fontSize: 25, fontFamily: fonts.display, textTransform: 'uppercase', letterSpacing: 0.4 },
  heroGroup: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, padding: 12, gap: 2 },
  statLabel: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 13 },
  statValue: { color: colors.text, fontSize: 21, fontFamily: fonts.display, textTransform: 'uppercase', letterSpacing: 0.4 },
  statSub: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12 },
  chartTitle: { color: colors.text, fontSize: 16, fontFamily: fonts.bold },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12 },
  detail: { gap: 8 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detailDate: { color: colors.text, fontSize: 15, fontFamily: fonts.bold },
  detailSets: { color: colors.textMuted, fontFamily: fonts.mono, fontSize: 14, lineHeight: 22 },
  histRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  histDate: { color: colors.text, fontFamily: fonts.bold },
  histSets: { color: colors.textMuted, fontFamily: fonts.mono, fontSize: 12, marginTop: 2 },
});
