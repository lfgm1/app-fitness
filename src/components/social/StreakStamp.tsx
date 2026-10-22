// Selo do streak ("18 SEM"): carimbo inclinado na cor do nível do fogo. Usado na lista de amigos,
// nos perfis e na Início. Tocando, abre a explicação do streak e dos níveis. Sem streak, não mostra nada.

import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { StreakInfo } from '@/components/social/StreakInfo';
import { streakLevel } from '@/lib/streak';
import { colors, fonts } from '@/theme';

type Props = {
  weeks: number;
  size?: 'small' | 'large';
  /** De quem é o streak: "Você" ou o nome da pessoa (aparece na explicação). */
  who?: string;
  /** Nome e ícone da pessoa, para os exemplos de fogo da explicação. */
  name?: string;
  icon?: string | null;
  /** Só o desenho, sem abrir a explicação (ex.: no card de novidade). */
  decorative?: boolean;
};

export function StreakStamp({ weeks, size = 'small', who = 'Você', name, icon, decorative = false }: Props) {
  const [info, setInfo] = useState(false);
  if (weeks <= 0) return null;
  const color = streakLevel(weeks).color;
  const large = size === 'large';
  return (
    <>
      <Pressable
        onPress={() => setInfo(true)}
        disabled={decorative}
        hitSlop={6}
        style={[styles.stamp, large && styles.stampLarge, { borderColor: color }]}
        accessibilityRole="button"
        accessibilityLabel={`${weeks} semanas de streak. Ver como funciona`}>
        <Text style={[styles.number, large && styles.numberLarge, { color }]}>{weeks}</Text>
        <Text style={[styles.label, large && styles.labelLarge, { color }]}>sem</Text>
      </Pressable>
      <StreakInfo visible={info} onClose={() => setInfo(false)} weeks={weeks} who={who} name={name} icon={icon} />
    </>
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
