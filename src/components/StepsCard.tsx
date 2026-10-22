// Linha de passos na aba Início: passos de hoje e uma barrinha até a meta. Tocando, abre a aba Passos.
// Some quando não dá para ler passos (site e Expo Go) ou a pessoa ainda não conectou.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui';
import { DEFAULT_STEP_GOAL, formatSteps, useSteps } from '@/lib/useSteps';
import { colors, fonts } from '@/theme';

export function StepsCard({ goal }: { goal: number | null }) {
  const target = goal ?? DEFAULT_STEP_GOAL;
  const { state, today } = useSteps();
  if (state !== 'connected') return null;
  const progress = Math.min(1, today / target);
  return (
    <Pressable onPress={() => router.push('/passos')} accessibilityRole="button" accessibilityLabel="Abrir passos">
      <Card style={styles.card}>
        <Ionicons name="footsteps" size={24} color={colors.primary} />
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={styles.text}>
            <Text style={styles.count}>{formatSteps(today)}</Text> de {formatSteps(target)} passos
          </Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${progress * 100}%` }]} />
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  text: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14 },
  count: { color: colors.text, fontFamily: fonts.bold, fontSize: 16 },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.background, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: colors.primary },
});
