import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { Frank } from '@/components/Frank';
import { RecordBurst } from '@/components/RecordBurst';
import { STATUS_INFO } from '@/lib/progress';
import type { ProgressStatus } from '@/lib/progress';
import { colors, fonts, hardShadow, outline, outlineColor, radius, statusColors } from '@/theme';

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
      style={({ pressed }) => {
        // Ao apertar, o botão "afunda": anda até onde estava a sombra e ela some.
        const offset = small ? 3 : 4;
        const shadowColor = variant === 'danger' ? colors.danger : outlineColor;
        const sinks = variant !== 'ghost' && pressed && !disabled;
        return [
          styles.button,
          small && styles.buttonSmall,
          variant === 'primary' && { backgroundColor: colors.primary },
          variant === 'secondary' && { backgroundColor: colors.cardAlt },
          variant === 'danger' && { backgroundColor: 'transparent', borderColor: colors.danger },
          variant === 'ghost' && { backgroundColor: 'transparent', borderWidth: 0 },
          variant !== 'ghost' && !sinks && hardShadow(shadowColor, offset),
          sinks && { transform: [{ translateX: offset }, { translateY: offset }] },
          variant === 'ghost' && pressed && { opacity: 0.6 },
          disabled && { opacity: 0.4 },
          style,
        ];
      }}>
      {icon && <Ionicons name={icon} size={small ? 16 : 20} color={fg} />}
      <Text style={[styles.buttonText, small && { fontFamily: fonts.regular, fontSize: 14 }, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

type EmptyStateProps = {
  title: string;
  text: string;
  /** Ícone simples (ex: sem internet) ou o Frank, para as telas vazias principais. */
  icon?: IconName;
  frank?: boolean;
  /** Ilustração própria da tela (tem prioridade sobre o Frank e o ícone). */
  illustration?: ReactNode;
};

export function EmptyState({ icon, title, text, frank, illustration }: EmptyStateProps) {
  return (
    <View style={styles.empty}>
      {illustration ??
        (frank ? <Frank phase="frango" size={110} /> : icon && <Ionicons name={icon} size={44} color={colors.textFaint} />)}
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

export function StatusBadge({ status, timed }: { status: ProgressStatus; timed?: boolean }) {
  const color = statusColors[status];
  const label = timed && status === 'carga' ? 'Tempo ↑' : STATUS_INFO[status].short;
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={[styles.badgeText, { color: colors.primaryText }]}>{label}</Text>
    </View>
  );
}

/** Selo de recorde pessoal (PR), em forma de explosão de gibi. */
export function PRBadge() {
  return <RecordBurst />;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

type SegmentedProps<T extends string> = {
  options: { key: T; label: string; icon?: IconName }[];
  value: T;
  onChange: (value: T) => void;
  /** Versão em botões separados, para um seletor dentro de outra tela que já tem um seletor. */
  small?: boolean;
};

/** Seletor de abas internas (ex: Treinos | Progresso). */
export function Segmented<T extends string>({ options, value, onChange, small }: SegmentedProps<T>) {
  return (
    <View style={[styles.segmented, small && styles.segmentedSmall]} accessibilityRole="tablist">
      {options.map((option) => {
        const active = option.key === value;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.key)}
            style={[
              styles.segment,
              small && styles.segmentSmall,
              active && (small ? styles.segmentSmallActive : styles.segmentActive),
            ]}>
            {option.icon && (
              <Ionicons
                name={option.icon}
                size={16}
                color={active ? colors.primaryText : colors.textMuted}
              />
            )}
            <Text
              style={[
                styles.segmentText,
                small && styles.segmentTextSmall,
                active && (small ? styles.segmentSmallTextActive : styles.segmentTextActive),
              ]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
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
    ...outline,
  },
  buttonSmall: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  buttonText: { fontSize: 16, fontFamily: fonts.bold },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius + 2,
    padding: 16,
    ...outline,
    ...hardShadow(colors.primary),
  },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24, gap: 8 },
  emptyTitle: { color: colors.text, fontSize: 18, fontFamily: fonts.bold, marginTop: 8 },
  emptyText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 15, textAlign: 'center', lineHeight: 21 },
  badge: { borderWidth: 2, borderColor: outlineColor, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontFamily: fonts.mono, letterSpacing: 0.3 },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 4,
    ...outline,
    ...hardShadow(colors.primary, 3),
  },
  segmentedSmall: { backgroundColor: 'transparent', borderWidth: 0, padding: 0, gap: 10, boxShadow: 'none' },
  segment: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 9 },
  segmentSmall: { paddingVertical: 11, borderRadius: 12, ...outline, backgroundColor: colors.card },
  segmentActive: { backgroundColor: colors.primary, borderWidth: 2, borderColor: outlineColor },
  segmentSmallActive: { backgroundColor: colors.primary, ...hardShadow(outlineColor, 3) },
  segmentText: { color: colors.textFaint, fontFamily: fonts.bold, fontSize: 15 },
  segmentTextSmall: { color: colors.textMuted, fontSize: 14 },
  segmentTextActive: { color: colors.primaryText },
  segmentSmallTextActive: { color: colors.primaryText },
  sectionTitle: {
    color: colors.pena,
    fontSize: 24,
    fontFamily: fonts.display,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 10,
  },
});
