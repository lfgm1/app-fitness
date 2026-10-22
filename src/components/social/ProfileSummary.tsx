// O que os outros veem no perfil de alguém: a etiqueta do nível do Frank e os números.
// Usado no perfil de outra pessoa e no "Como os outros te veem" do Meu Perfil.

import { StyleSheet, Text, View } from 'react-native';

import { StreakStamp } from '@/components/social/StreakStamp';
import { Card } from '@/components/ui';
import type { SocialProfile } from '@/data/social';
import { FRANK_PHASES } from '@/lib/frank';
import { colors, fonts, outlineColor } from '@/theme';

/** A fase do Frank e, ao lado, o streak (se tiver fogo). */
export function PhaseTag({
  person,
  streakWeeks = 0,
  mine = false,
}: {
  person: SocialProfile;
  streakWeeks?: number;
  /** É o meu perfil (a explicação do streak fala "Você"). */
  mine?: boolean;
}) {
  const phase = FRANK_PHASES.find((p) => p.phase === person.phase);
  if (!phase) return null;
  return (
    <View style={styles.tags}>
      <View style={styles.tag}>
        <Text style={styles.tagText}>{phase.name}</Text>
      </View>
      <StreakStamp
        weeks={streakWeeks}
        size="large"
        who={mine ? 'Você' : person.displayName}
        name={person.displayName}
        icon={person.avatar}
      />
    </View>
  );
}

export function ProfileStats({ person }: { person: SocialProfile }) {
  return (
    <View style={styles.stats}>
      <Stat value={person.workoutCount} label="treinos" color={colors.primary} />
      {person.showRecords && <Stat value={person.recordCount} label="recordes" color={colors.bico} />}
      <Stat value={person.weekCount} label="esta semana" color={colors.text} />
    </View>
  );
}

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <Card style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  tags: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  tag: {
    paddingHorizontal: 12,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: outlineColor,
    transform: [{ rotate: '-2deg' }],
  },
  tagText: {
    color: colors.primaryText,
    fontFamily: fonts.display,
    fontSize: 24,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  stats: { flexDirection: 'row', gap: 10, width: '100%' },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontFamily: fonts.display, fontSize: 30 },
  statLabel: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 13 },
});
