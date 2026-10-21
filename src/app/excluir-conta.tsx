import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, Card } from '@/components/ui';
import { authErrorMessage, useAuth } from '@/data/auth';
import { clearLocalData } from '@/data/store';
import { colors, fonts, outline, radius } from '@/theme';

const CONFIRM_WORD = 'EXCLUIR';

export default function DeleteAccountScreen() {
  const { deleteAccount, signOut } = useAuth();
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await deleteAccount();
      await clearLocalData();
      await signOut();
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Card style={styles.warning}>
        <Ionicons name="warning-outline" size={28} color={colors.danger} />
        <Text style={styles.title}>Esta ação não pode ser desfeita</Text>
        <Text style={styles.text}>Ao excluir sua conta, apagamos permanentemente:</Text>
        <View style={{ gap: 4 }}>
          {['Seu perfil e dados pessoais', 'Seus treinos montados e exercícios criados', 'Todo o histórico e os gráficos de progressão'].map(
            (item) => (
              <Text key={item} style={styles.text}>
                • {item}
              </Text>
            )
          )}
        </View>
      </Card>

      <Text style={styles.label}>
        Para confirmar, digite <Text style={styles.word}>{CONFIRM_WORD}</Text>:
      </Text>
      <TextInput
        style={styles.input}
        value={typed}
        onChangeText={setTyped}
        placeholder={CONFIRM_WORD}
        placeholderTextColor={colors.textFaint}
        autoCapitalize="characters"
        autoCorrect={false}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Button
        title={busy ? 'Excluindo...' : 'Excluir minha conta'}
        icon="trash-outline"
        variant="danger"
        onPress={remove}
        disabled={busy || typed.trim().toUpperCase() !== CONFIRM_WORD}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14 },
  warning: { gap: 10, borderColor: colors.danger },
  title: { color: colors.text, fontSize: 23, fontFamily: fonts.display, textTransform: 'uppercase', letterSpacing: 0.4 },
  text: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  label: { color: colors.text, fontFamily: fonts.regular, fontSize: 15 },
  word: { color: colors.danger, fontFamily: fonts.display, textTransform: 'uppercase', letterSpacing: 0.4 },
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
