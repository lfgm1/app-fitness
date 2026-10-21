import { StyleSheet, Text, View } from 'react-native';

import { FrankHead } from '@/components/Frank';
import { colors, fonts } from '@/theme';

/** Logo do Gains Club: ícone do Frank + "Gains / Club" em duas linhas. */
export function Logo({ size = 40 }: { size?: number }) {
  const fontSize = size * 0.6;
  return (
    <View style={styles.row} accessibilityRole="header" accessibilityLabel="Gains Club">
      <View style={[styles.icon, { width: size, height: size, borderRadius: size * 0.24 }]}>
        <FrankHead size={size} />
      </View>
      <View>
        <Text style={[styles.word, { fontSize, lineHeight: fontSize * 0.9 }]}>Gains</Text>
        <Text style={[styles.word, styles.accent, { fontSize, lineHeight: fontSize * 0.9 }]}>Club</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  word: { color: colors.text, fontFamily: fonts.display, textTransform: 'uppercase', letterSpacing: 0.4 },
  accent: { color: colors.primary },
});
