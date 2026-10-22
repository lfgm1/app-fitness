// Ícone de um grupo: o desenho escolhido ou, nos grupos antigos, o emoji num círculo com contorno.

import { Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { findGroupIcon } from '@/lib/groupIcons';
import { colors, outlineColor } from '@/theme';

type Props = { icon?: string | null; emoji?: string; size?: number };

export function GroupIcon({ icon, emoji = '💪', size = 38 }: Props) {
  const chosen = findGroupIcon(icon);
  if (chosen) {
    // Recorta em círculo: nada do desenho aparece fora da borda.
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
        <SvgXml xml={chosen.xml} width={size} height={size} />
      </View>
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.cardAlt,
        borderWidth: 2,
        borderColor: outlineColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
    </View>
  );
}
