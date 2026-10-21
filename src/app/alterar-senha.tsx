import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import type { TextInputProps } from 'react-native';

import { Button } from '@/components/ui';
import { authErrorMessage, useAuth } from '@/data/auth';
import { notify } from '@/lib/format';
import { colors, fonts, outline, radius } from '@/theme';

const MIN_LENGTH = 6;

export default function ChangePasswordScreen() {
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mismatch = confirm.length > 0 && next !== confirm;
  const canSave = !busy && current.length > 0 && next.length >= MIN_LENGTH && next === confirm;

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await changePassword(current, next);
      notify('Senha alterada', 'Sua nova senha já está valendo.');
      router.back();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Field value={current} onChangeText={setCurrent} placeholder="Senha atual" autoComplete="current-password" />
      <Field
        value={next}
        onChangeText={setNext}
        placeholder={`Nova senha (mín. ${MIN_LENGTH} caracteres)`}
        autoComplete="new-password"
      />
      <Field value={confirm} onChangeText={setConfirm} placeholder="Confirme a nova senha" autoComplete="new-password" />
      {mismatch && <Text style={styles.error}>As senhas não são iguais.</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
      <Button title={busy ? 'Salvando...' : 'Salvar nova senha'} icon="checkmark" onPress={save} disabled={!canSave} />
    </ScrollView>
  );
}

function Field(props: TextInputProps) {
  return (
    <TextInput
      style={styles.input}
      placeholderTextColor={colors.textFaint}
      secureTextEntry
      autoCapitalize="none"
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  input: {
    backgroundColor: colors.card,
    color: colors.text,
    fontFamily: fonts.regular, fontSize: 16,
    padding: 14,
    borderRadius: radius,
    ...outline,
  },
  error: { color: colors.danger, fontFamily: fonts.regular, fontSize: 14 },
});
