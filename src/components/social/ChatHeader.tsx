// Topo das conversas: ícone, nome e uma linha embaixo (quem está no grupo ou o @ da pessoa).
// Tocar abre os membros do grupo ou o perfil da pessoa.

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';

type Props = { icon: ReactNode; title: string; subtitle?: string; onPress: () => void };

export function ChatHeader({ icon, title, subtitle, onPress }: Props) {
  return (
    <Pressable style={styles.header} onPress={onPress} hitSlop={6} accessibilityRole="button">
      {icon}
      <View style={styles.texts}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, maxWidth: 260 },
  texts: { flexShrink: 1 },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 17 },
  subtitle: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12 },
});
