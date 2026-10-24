// Foto de perfil do Social: o ícone escolhido pela pessoa ou, se não escolheu, a inicial do nome.
// Com streak, ganha o fogo atrás (veja StreakFire). No futuro pode entrar uma foto e uma borda especial.

import { Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { StreakFire } from '@/components/social/StreakFire';
import { findAvatarIcon } from '@/lib/avatars';
import { streakLevel } from '@/lib/streak';
import { colors, fonts, outlineColor } from '@/theme';

type Props = {
  name?: string;
  icon?: string | null;
  size?: number;
  /** Semanas seguidas de streak (já conferidas com liveStreak). Acima de 2, aparece o fogo. */
  streakWeeks?: number;
};

export function Avatar({ name, icon, size = 44, streakWeeks = 0 }: Props) {
  return (
    <StreakFire level={streakLevel(streakWeeks).level} size={size}>
      <AvatarCircle name={name} icon={icon} size={size} />
    </StreakFire>
  );
}

export function AvatarCircle({ name, icon, size }: { name?: string; icon?: string | null; size: number }) {
  const chosen = findAvatarIcon(icon);
  if (chosen) {
    // Recorta em círculo: nada do desenho aparece fora da borda.
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
        <SvgXml xml={chosen.xml} width={size} height={size} />
      </View>
    );
  }

  const initial = (name ?? '').trim().charAt(0).toUpperCase() || '?';
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.cardAlt,
        borderWidth: size >= 80 ? 3.5 : 2,
        borderColor: outlineColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{ color: colors.text, fontFamily: fonts.display, fontSize: size * 0.48, lineHeight: size * 0.6 }}>
        {initial}
      </Text>
    </View>
  );
}
