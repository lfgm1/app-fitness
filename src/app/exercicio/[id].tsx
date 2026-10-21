import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ExerciseImage } from '@/components/ExerciseImage';
import { ProgressChart } from '@/components/ProgressChart';
import { Card, EmptyState, SectionTitle, StatusBadge } from '@/components/ui';
import { useStore } from '@/data/store';
import { formatDate, formatDateLong } from '@/lib/format';
import { useUnits } from '@/lib/units';
import { STATUS_INFO, exerciseHistory } from '@/lib/progress';
import type { ProgressStatus } from '@/lib/progress';
import { colors, statusColors } from '@/theme';

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
  const record = history.reduce((best, h) =>
    h.best.weight > best.best.weight || (h.best.weight === best.best.weight && h.best.reps > best.best.reps)
      ? h
      : best
  );
  const diff = last.best.weight - first.best.weight;
  const pct = first.best.weight > 0 ? Math.round((diff / first.best.weight) * 100) : 0;
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
          <Stat label="Recorde" value={units.set(record.best)} />
          <Stat
            label="Evolução"
            value={`${diff >= 0 ? '+' : ''}${units.weight(diff)}${units.unit}`}
            sub={history.length > 1 ? `${pct >= 0 ? '+' : ''}${pct}%` : undefined}
            color={diff > 0 ? statusColors.carga : diff < 0 ? statusColors.regrediu : undefined}
          />
        </View>

        <Card style={{ gap: 8 }}>
          <Text style={styles.chartTitle}>Carga máxima por treino</Text>
          <ProgressChart entries={history} selectedIndex={selected} onSelect={setSelected} />
          <View style={styles.legend}>
            {LEGEND.map((s) => (
              <View key={s} style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: statusColors[s] }]} />
                <Text style={styles.legendText}>{STATUS_INFO[s].label}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.chartHint}>
            O número acima de cada ponto são as repetições da melhor série. Micro progressão é quando a carga
            máxima se mantém, mas você faz mais repetições com ela (em uma série ou somando as séries). Toque em um
            ponto para ver os detalhes.
          </Text>
        </Card>

        <Card style={[styles.detail, { borderColor: statusColors[point.status] }]}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailDate}>{formatDateLong(point.date)}</Text>
            <StatusBadge status={point.status} />
          </View>
          <Text style={styles.detailSets}>{point.sets.map(units.set).join('  ·  ')}</Text>
        </Card>

        <View style={styles.statsRow}>
          <Stat label="Progressões de carga" value={String(loadUps)} color={statusColors.carga} />
          <Stat label="Micro progressões" value={String(microUps)} color={statusColors.micro} />
          <Stat label="Treinos" value={String(history.length)} />
        </View>

        <SectionTitle>Histórico</SectionTitle>
        {[...history].reverse().map((h) => {
          const index = history.indexOf(h);
          return (
            <Pressable key={h.sessionId} onPress={() => setSelected(index)}>
              <Card style={[styles.histRow, index === selected && { borderColor: colors.textMuted }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.histDate}>{formatDate(h.date)}</Text>
                  <Text style={styles.histSets}>{h.sets.map(units.set).join(' · ')}</Text>
                </View>
                <StatusBadge status={h.status} />
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
  heroName: { color: colors.text, fontSize: 20, fontWeight: '800' },
  heroGroup: { color: colors.textMuted, fontSize: 14, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, padding: 12, gap: 2 },
  statLabel: { color: colors.textMuted, fontSize: 12 },
  statValue: { color: colors.text, fontSize: 17, fontWeight: '800' },
  statSub: { color: colors.textMuted, fontSize: 12 },
  chartTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: colors.textMuted, fontSize: 12 },
  chartHint: { color: colors.textFaint, fontSize: 12, lineHeight: 17 },
  detail: { gap: 8 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detailDate: { color: colors.text, fontSize: 15, fontWeight: '700' },
  detailSets: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  histRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  histDate: { color: colors.text, fontWeight: '700' },
  histSets: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
});
