import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { FriendChecklist } from '@/components/social/FriendChecklist';
import { GroupIcon } from '@/components/social/GroupIcon';
import { GroupIconPicker } from '@/components/social/GroupIconPicker';
import { Button, SectionTitle } from '@/components/ui';
import { useAuth } from '@/data/auth';
import { addClubMembers, createClub } from '@/data/social';
import { notify } from '@/lib/format';
import { DEFAULT_GROUP_ICON } from '@/lib/groupIcons';
import { colors, fonts, outline, radius } from '@/theme';

/** Criar um grupo novo ou entrar num grupo com o código de convite. */
export default function NewClubScreen() {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(DEFAULT_GROUP_ICON);
  const [picking, setPicking] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const { session } = useAuth();
  const userId = session!.user.id;
  // Amigos marcados para já entrarem no grupo.
  const [friends, setFriends] = useState<string[]>([]);

  async function create() {
    setBusy(true);
    try {
      const id = await createClub(name.trim(), icon);
      if (friends.length > 0) await addClubMembers(id, friends);
      router.replace({ pathname: '/clubes/info/[id]', params: { id, novo: '1' } });
    } catch (e) {
      notify('Não deu para criar', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Mostra a prévia do grupo (nome, ícone e membros) antes de entrar.
  function join() {
    router.push({ pathname: '/convite/[code]', params: { code } });
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <SectionTitle>Criar um grupo</SectionTitle>
      <View style={styles.nameRow}>
        {/* Tocar no ícone abre a lista para escolher outro */}
        <Pressable onPress={() => setPicking(true)} accessibilityLabel="Escolher o ícone do grupo">
          <GroupIcon icon={icon} size={64} />
          <View style={styles.editBadge}>
            <Ionicons name="pencil" size={12} color={colors.primaryText} />
          </View>
        </Pressable>
        <View style={[styles.field, { flex: 1 }]}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            maxLength={40}
            placeholder="Nome do grupo"
            placeholderTextColor={colors.textFaint}
          />
        </View>
      </View>
      <GroupIconPicker visible={picking} value={icon} onChange={setIcon} onClose={() => setPicking(false)} />

      <SectionTitle>Chamar amigos</SectionTitle>
      <FriendChecklist userId={userId} selected={friends} onChange={setFriends} />

      <Button
        title={
          busy ? 'Criando...' : friends.length > 0 ? `Criar grupo com ${friends.length + 1} pessoas` : 'Criar grupo'
        }
        icon="add"
        onPress={create}
        disabled={busy || !name.trim()}
      />

      <SectionTitle>Entrar com código</SectionTitle>
      <View style={styles.field}>
        <TextInput
          style={[styles.input, styles.codeInput]}
          value={code}
          onChangeText={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={8}
          placeholder="Código do grupo"
          placeholderTextColor={colors.textFaint}
        />
      </View>
      <Button title="Entrar no grupo" variant="secondary" onPress={join} disabled={busy || code.length < 6} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  field: { paddingHorizontal: 14, backgroundColor: colors.card, borderRadius: radius, ...outline },
  input: { color: colors.text, fontFamily: fonts.regular, fontSize: 16, paddingVertical: 13 },
  codeInput: { fontFamily: fonts.mono, letterSpacing: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  editBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
