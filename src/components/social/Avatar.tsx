// Foto de perfil do Social: o ícone escolhido pela pessoa ou, se não escolheu, a inicial do nome.
// No futuro pode entrar uma foto (e a borda pode mudar com o nível do Frank).

import { Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { findAvatarIcon } from '@/lib/avatars';
import { colors, fonts, outlineColor } from '@/theme';

type Props = { name?: string; icon?: string | null; size?: number };

export function Avatar({ name, icon, size = 44 }: Props) {
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
