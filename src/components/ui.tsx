import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { STATUS_INFO } from '@/lib/progress';
import type { ProgressStatus } from '@/lib/progress';
import { colors, radius, statusColors } from '@/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

type ButtonProps = {
  title: string;
  onPress: () => void;
  icon?: IconName;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
};

export function Button({ title, onPress, icon, variant = 'primary', disabled, style, small }: ButtonProps) {
  const fg =
    variant === 'primary' ? colors.primaryText : variant === 'danger' ? colors.danger : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        variant === 'primary' && { backgroundColor: colors.primary },
        variant === 'secondary' && { backgroundColor: colors.cardAlt },
        variant === 'danger' && { backgroundColor: 'transparent', borderColor: colors.danger, borderWidth: 1 },
        variant === 'ghost' && { backgroundColor: 'transparent' },
        (pressed || disabled) && { opacity: disabled ? 0.4 : 0.75 },
        style,
      ]}>
      {icon && <Ionicons name={icon} size={small ? 16 : 20} color={fg} />}
      <Text style={[styles.buttonText, small && { fontSize: 14 }, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function EmptyState({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={44} color={colors.textFaint} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

export function StatusBadge({ status }: { status: ProgressStatus }) {
  const color = statusColors[status];
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{STATUS_INFO[status].short}</Text>
    </View>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: radius,
  },
  buttonSmall: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  buttonText: { fontSize: 16, fontWeight: '700' },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24, gap: 8 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 8 },
  emptyText: { color: colors.textMuted, fontSize: 15, textAlign: 'center', lineHeight: 21 },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 8,
  },
});
