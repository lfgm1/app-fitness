// Selo do streak ("18 SEM"): carimbo inclinado na cor do nível do fogo. Usado na lista de amigos e
// nos perfis. Sem streak, não mostra nada.

import { StyleSheet, Text, View } from 'react-native';

import { streakLevel } from '@/lib/streak';
import { colors, fonts } from '@/theme';

type Props = { weeks: number; size?: 'small' | 'large' };

export function StreakStamp({ weeks, size = 'small' }: Props) {
  if (weeks <= 0) return null;
  const color = streakLevel(weeks).color;
  const large = size === 'large';
  return (
    <View
      style={[styles.stamp, large && styles.stampLarge, { borderColor: color }]}
      accessibilityLabel={`${weeks} semanas de streak`}>
      <Text style={[styles.number, large && styles.numberLarge, { color }]}>{weeks}</Text>
      <Text style={[styles.label, large && styles.labelLarge, { color }]}>sem</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stamp: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 2,
    borderRadius: 8,
    backgroundColor: colors.background,
    transform: [{ rotate: '-3deg' }],
  },
  stampLarge: { paddingHorizontal: 12, paddingVertical: 4, borderWidth: 3 },
  number: { fontFamily: fonts.display, fontSize: 18, letterSpacing: 0.5 },
  numberLarge: { fontSize: 24 },
  label: { fontFamily: fonts.bold, fontSize: 10, textTransform: 'uppercase' },
  labelLarge: { fontSize: 12 },
});
