// Janela para mudar a meta diária de passos pela aba Passos: metas prontas ou ajuste de 500 em 500.
// Salva no perfil (o mesmo campo de "Meta diária de passos" do Perfil).

import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { formatSteps } from '@/lib/useSteps';
import { colors, fonts, outlineColor } from '@/theme';

const PRESETS = [5000, 8000, 10000, 12000, 15000];
const STEP = 500;
const MIN = 1000;
const MAX = 100000;

type Props = {
  visible: boolean;
  goal: number;
  onClose: () => void;
  onSave: (goal: number) => Promise<void>;
};

export function StepGoalSheet({ visible, goal, onClose, onSave }: Props) {
  const [value, setValue] = useState(goal);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  // Toda vez que abre, começa na meta atual.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setValue(goal);
      setError(false);
    }
  }

  function adjust(delta: number) {
    setValue((v) => Math.min(MAX, Math.max(MIN, v + delta)));
  }

  async function save() {
    setSaving(true);
    setError(false);
    try {
      await onSave(value);
      onClose();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fechar" />
      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Meta de passos</Text>

        <View style={styles.stepper}>
          <Pressable
            onPress={() => adjust(-STEP)}
            disabled={value <= MIN}
            hitSlop={8}
            style={[styles.round, value <= MIN && { opacity: 0.4 }]}
            accessibilityLabel="Diminuir 500 passos">
            <Ionicons name="remove" size={24} color={colors.text} />
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.value}>{formatSteps(value)}</Text>
            <Text style={styles.unit}>passos por dia</Text>
          </View>
          <Pressable
            onPress={() => adjust(STEP)}
            disabled={value >= MAX}
            hitSlop={8}
            style={[styles.round, value >= MAX && { opacity: 0.4 }]}
            accessibilityLabel="Aumentar 500 passos">
            <Ionicons name="add" size={24} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.chips}>
          {PRESETS.map((p) => (
            <Pressable
              key={p}
              onPress={() => setValue(p)}
              style={[styles.chip, value === p && styles.chipOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: value === p }}>
              <Text style={[styles.chipText, value === p && { color: colors.primaryText }]}>{formatSteps(p)}</Text>
            </Pressable>
          ))}
        </View>

        {error && <Text style={styles.error}>Não deu para salvar. Tente de novo.</Text>}
        <Button title={saving ? 'Salvando...' : 'Salvar meta'} onPress={save} disabled={saving || value === goal} />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 2.5,
    borderColor: outlineColor,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 16,
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.textFaint },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 30,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  round: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: outlineColor,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { color: colors.text, fontFamily: fonts.display, fontSize: 44, letterSpacing: 0.5 },
  unit: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: outlineColor },
  chipText: { color: colors.text, fontFamily: fonts.bold, fontSize: 14 },
  error: { color: colors.danger, fontFamily: fonts.regular, fontSize: 13, textAlign: 'center' },
});
