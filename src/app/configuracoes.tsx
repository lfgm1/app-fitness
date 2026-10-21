import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';

import { Button, Card, SectionTitle } from '@/components/ui';
import type { IconName } from '@/components/ui';
import { useAuth } from '@/data/auth';
import { useProfile } from '@/data/profile';
import type { Profile, WeightUnit } from '@/data/profile';
import { clearLocalData, useStore } from '@/data/store';
import { confirmAction, notify } from '@/lib/format';
import { colors, fonts } from '@/theme';

const MIN_SETS = 1;
const MAX_SETS = 10;

export default function SettingsScreen() {
  const { session, signOut } = useAuth();
  const { profile, saveProfile } = useProfile();
  const { syncNow, pendingNow } = useStore();
  const [leaving, setLeaving] = useState(false);
  const [saving, setSaving] = useState(false);

  // Contas criadas só com o Google não têm senha para alterar.
  const hasPassword = session?.user.app_metadata.providers?.includes('email') ?? false;

  async function updatePreferences(changes: Partial<Pick<Profile, 'weightUnit' | 'defaultSets'>>) {
    if (!profile || saving) return;
    setSaving(true);
    try {
      await saveProfile({ ...profile, ...changes });
    } catch {
      notify('Não foi possível salvar', 'Verifique sua conexão com a internet e tente de novo.');
    } finally {
      setSaving(false);
    }
  }

  async function leave() {
    setLeaving(true);
    await syncNow(); // envia o que faltar antes de sair
    const pending = pendingNow();
    setLeaving(false);
    const doSignOut = async () => {
      await clearLocalData();
      await signOut();
    };
    if (pending > 0) {
      confirmAction(
        'Há dados não enviados',
        `${pending} alteração(ões) ainda não foram salvas na nuvem (sem internet?). Se sair agora, elas serão perdidas. Conecte-se à internet e tente de novo, ou saia mesmo assim.`,
        'Sair mesmo assim',
        doSignOut
      );
    } else {
      confirmAction('Sair da conta?', 'Seus dados continuam salvos na sua conta.', 'Sair', doSignOut);
    }
  }

  const unit = profile?.weightUnit ?? 'kg';
  const sets = profile?.defaultSets ?? 2;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SectionTitle>Conta</SectionTitle>
      <Card style={styles.group}>
        <Row icon="mail-outline" label="E-mail">
          <Text style={styles.value} numberOfLines={1}>
            {session?.user.email}
          </Text>
        </Row>
        {hasPassword && (
          <Row icon="key-outline" label="Alterar senha" onPress={() => router.push('/alterar-senha')} divider />
        )}
      </Card>

      <SectionTitle>Treino</SectionTitle>
      <Card style={styles.group}>
        <Row icon="barbell-outline" label="Unidade de peso">
          <View style={styles.segmented}>
            {(['kg', 'lb'] as WeightUnit[]).map((option) => (
              <Pressable
                key={option}
                onPress={() => option !== unit && updatePreferences({ weightUnit: option })}
                style={[styles.segment, unit === option && styles.segmentActive]}
                accessibilityRole="radio"
                accessibilityState={{ selected: unit === option }}>
                <Text style={[styles.segmentText, unit === option && styles.segmentTextActive]}>{option}</Text>
              </Pressable>
            ))}
          </View>
        </Row>
        <Row icon="layers-outline" label="Séries padrão" hint="Ao registrar um exercício pela primeira vez" divider>
          <View style={styles.stepper}>
            <Pressable
              style={styles.stepperButton}
              onPress={() => updatePreferences({ defaultSets: sets - 1 })}
              disabled={sets <= MIN_SETS}
              accessibilityLabel="Menos uma série">
              <Ionicons name="remove" size={18} color={sets <= MIN_SETS ? colors.border : colors.text} />
            </Pressable>
            <Text style={styles.stepperValue}>{sets}</Text>
            <Pressable
              style={styles.stepperButton}
              onPress={() => updatePreferences({ defaultSets: sets + 1 })}
              disabled={sets >= MAX_SETS}
              accessibilityLabel="Mais uma série">
              <Ionicons name="add" size={18} color={sets >= MAX_SETS ? colors.border : colors.text} />
            </Pressable>
          </View>
        </Row>
      </Card>

      <SectionTitle>Dados e privacidade</SectionTitle>
      <Card style={styles.group}>
        <Row icon="shield-checkmark-outline" label="Política de privacidade" onPress={() => router.push('/privacidade')} />
      </Card>

      <SectionTitle>Sobre</SectionTitle>
      <Card style={styles.group}>
        <Row icon="information-circle-outline" label="Versão">
          <Text style={styles.value}>{Constants.expoConfig?.version ?? '1.0.0'}</Text>
        </Row>
      </Card>

      <Button
        title={leaving ? 'Saindo...' : 'Sair da conta'}
        icon="log-out-outline"
        variant="secondary"
        onPress={leave}
        disabled={leaving}
        style={{ marginTop: 8 }}
      />
      <Pressable onPress={() => router.push('/excluir-conta')} style={styles.deleteLink} accessibilityRole="button">
        <Text style={styles.deleteText}>Excluir conta</Text>
      </Pressable>
    </ScrollView>
  );
}

type RowProps = {
  icon: IconName;
  label: string;
  hint?: string;
  onPress?: () => void;
  divider?: boolean;
  children?: ReactNode;
};

function Row({ icon, label, hint, onPress, divider, children }: RowProps) {
  const content = (
    <>
      <Ionicons name={icon} size={20} color={colors.textMuted} />
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        {hint && <Text style={styles.hint}>{hint}</Text>}
      </View>
      {children}
      {onPress && <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />}
    </>
  );
  const style = [styles.row, divider && styles.divider];
  if (!onPress) return <View style={style}>{content}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [...style, pressed && { backgroundColor: colors.cardAlt }]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 10, paddingBottom: 40 },
  group: { padding: 0, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  label: { color: colors.text, fontFamily: fonts.regular, fontSize: 16 },
  hint: { color: colors.textFaint, fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  value: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 15, flexShrink: 1, maxWidth: '60%' },
  segmented: { flexDirection: 'row', backgroundColor: colors.cardAlt, borderRadius: 10, padding: 3 },
  segment: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 },
  segmentActive: { backgroundColor: colors.primary },
  segmentText: { color: colors.textMuted, fontFamily: fonts.bold },
  segmentTextActive: { color: colors.primaryText },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: { color: colors.text, fontSize: 20, fontFamily: fonts.display, textTransform: 'uppercase', letterSpacing: 0.4, minWidth: 28, textAlign: 'center' },
  deleteLink: { alignSelf: 'center', padding: 12 },
  deleteText: { color: colors.danger, fontSize: 14, fontFamily: fonts.semibold },
});
