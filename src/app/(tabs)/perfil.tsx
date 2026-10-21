import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card, EmptyState, SectionTitle } from '@/components/ui';
import { useAuth } from '@/data/auth';
import { EXPERIENCE_HINTS, EXPERIENCE_LABELS, SEX_LABELS, useProfile } from '@/data/profile';
import { ageFrom, formatBirthDate } from '@/lib/format';
import { kgToUnit, useUnits } from '@/lib/units';
import { colors } from '@/theme';

function formatSteps(n: number) {
  return String(n).replace(/\B(?=(\d{3})+$)/g, '.');
}

export default function ProfileScreen() {
  const { session } = useAuth();
  const { profile } = useProfile();
  const units = useUnits();

  if (!profile) {
    return (
      <EmptyState
        icon="cloud-offline-outline"
        title="Perfil indisponível"
        text="Conecte-se à internet para carregar seu perfil."
      />
    );
  }

  const rows: [string, string | null][] = [
    [
      'Data de nascimento',
      profile.birthDate ? `${formatBirthDate(profile.birthDate)} (${ageFrom(profile.birthDate)} anos)` : null,
    ],
    ['Sexo', profile.sex ? SEX_LABELS[profile.sex] : null],
    ['Altura', profile.heightCm ? `${profile.heightCm} cm` : null],
    ['Peso', profile.weightKg ? `${Math.round(kgToUnit(profile.weightKg, units.unit))} ${units.unit}` : null],
    [
      'Experiência',
      profile.experience ? `${EXPERIENCE_LABELS[profile.experience]} · ${EXPERIENCE_HINTS[profile.experience]}` : null,
    ],
    ['Meta diária de passos', profile.dailyStepGoal ? `${formatSteps(profile.dailyStepGoal)} passos` : null],
  ];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.initial}>{(profile.name ?? session?.user.email ?? '?').charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{profile.name ?? 'Sem nome'}</Text>
        <Text style={styles.email}>{session?.user.email}</Text>
      </View>

      <SectionTitle>Seus dados</SectionTitle>
      <Card style={{ padding: 0 }}>
        {rows.map(([label, value], index) => (
          <View key={label} style={[styles.row, index > 0 && styles.divider]}>
            <Text style={styles.label}>{label}</Text>
            <Text style={[styles.value, !value && styles.empty]}>{value ?? 'Não informado'}</Text>
          </View>
        ))}
      </Card>

      <Button title="Editar perfil" icon="create-outline" variant="secondary" onPress={() => router.push('/editar-perfil')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  header: { alignItems: 'center', paddingVertical: 12, gap: 4 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  initial: { color: colors.primaryText, fontSize: 34, fontWeight: '800' },
  name: { color: colors.text, fontSize: 22, fontWeight: '800' },
  email: { color: colors.textMuted, fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  label: { color: colors.textMuted, fontSize: 15, flex: 1 },
  value: { color: colors.text, fontSize: 15, fontWeight: '600', textAlign: 'right', flexShrink: 1 },
  empty: { color: colors.textFaint, fontWeight: '400' },
});
