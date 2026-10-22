import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/components/social/Avatar';
import { Button, Card, SectionTitle } from '@/components/ui';
import { useAuth } from '@/data/auth';
import { findUser, getProfile, inviteLink, shareText } from '@/data/social';
import type { SocialProfile } from '@/data/social';
import { notify } from '@/lib/format';
import { colors, fonts, outline, radius } from '@/theme';

type Found = Pick<SocialProfile, 'userId' | 'username' | 'displayName' | 'phase' | 'avatar'>;

/** Achar alguém pelo @ ou pelo código (abre o perfil, onde dá para mandar o pedido) e mandar o próprio código. */
export default function AddFriendScreen() {
  const { session } = useAuth();
  const userId = session!.user.id;
  const [me, setMe] = useState<SocialProfile | null>(null);
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<Found | null | undefined>(undefined);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getProfile(userId)
        .then(setMe)
        .catch(() => {});
    }, [userId])
  );

  async function search() {
    setBusy(true);
    try {
      setFound(await findUser(query));
    } catch (e) {
      notify('Não deu para buscar', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Abre a tela do convite: grupo mostra a prévia com "Entrar no grupo"; amigo abre o perfil.
  function useCode() {
    router.push({ pathname: '/convite/[code]', params: { code } });
  }

  async function shareMyCode() {
    if (!me) return;
    const how = await shareText(
      `Bora treinar junto no Gains Club! Me adiciona: ${inviteLink(me.friendCode)} (ou use o código ${me.friendCode})`
    ).catch(() => null);
    if (how === 'copiado') notify('Link copiado', 'Cole na conversa com seu amigo.');
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <SectionTitle>Buscar pelo @</SectionTitle>
      <View style={styles.searchRow}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.at}>@</Text>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={(v) => {
              setQuery(v.toLowerCase().replace(/\s/g, ''));
              setFound(undefined);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="usuario.do.amigo"
            placeholderTextColor={colors.textFaint}
            onSubmitEditing={search}
          />
        </View>
        <Button title="Buscar" small onPress={search} disabled={busy || query.replace('@', '').length < 3} />
      </View>
      {found === null && <Text style={styles.muted}>Ninguém encontrado com esse @. Confira se está certinho.</Text>}
      {found && (
        <Pressable onPress={() => router.push({ pathname: '/usuario/[id]', params: { id: found.userId } })}>
          <Card style={styles.row}>
            <Avatar name={found.displayName} icon={found.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{found.displayName}</Text>
              <Text style={styles.muted}>@{found.username}</Text>
            </View>
            <Text style={styles.link}>Ver perfil</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
          </Card>
        </Pressable>
      )}

      <SectionTitle>Seu código de amigo</SectionTitle>
      <Card style={styles.codeCard}>
        <Text style={styles.code}>{me?.friendCode ?? '······'}</Text>
        <Text style={styles.muted}>
          Quem usar seu código ou abrir seu link vê seu perfil e pode te mandar um pedido de amizade.
        </Text>
        <Button title="Enviar meu link" icon="share-social-outline" onPress={shareMyCode} disabled={!me} />
      </Card>

      <SectionTitle>Recebeu um código?</SectionTitle>
      <View style={styles.searchRow}>
        <View style={[styles.field, { flex: 1 }]}>
          <TextInput
            style={[styles.input, styles.codeInput]}
            value={code}
            onChangeText={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={8}
            placeholder="Código de amigo ou de grupo"
            placeholderTextColor={colors.textFaint}
          />
        </View>
        <Button title="Usar" small onPress={useCode} disabled={busy || code.length < 6} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    backgroundColor: colors.card,
    borderRadius: radius,
    ...outline,
  },
  at: { color: colors.primary, fontFamily: fonts.bold, fontSize: 17 },
  input: {
    flex: 1,
    minWidth: 0,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 16,
    paddingVertical: 12,
    paddingLeft: 4,
  },
  codeInput: { fontFamily: fonts.mono, letterSpacing: 2, paddingLeft: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { color: colors.text, fontFamily: fonts.bold, fontSize: 15 },
  muted: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  link: { color: colors.primary, fontFamily: fonts.bold, fontSize: 13 },
  codeCard: { alignItems: 'center', gap: 10 },
  code: { color: colors.primary, fontFamily: fonts.mono, fontSize: 32, letterSpacing: 6 },
});
