// Campos do perfil público dentro de "Editar perfil": o ícone, o nome de usuário (@) e quem pode ver o perfil.
// O hook devolve os dois campos (cada um vai num lugar do formulário), um aviso se algo estiver
// errado e a função que salva, para o formulário principal salvar tudo com um botão só.
// O nome que aparece no Clube é o próprio Nome do perfil.

import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AvatarPicker } from '@/components/social/AvatarPicker';
import { computeStats } from '@/components/social/SocialStatsSync';
import { Card, SectionTitle } from '@/components/ui';
import { findUser, isValidUsername, saveMyProfile, suggestUsername, updateMyStats } from '@/data/social';
import type { SocialProfile, Visibility } from '@/data/social';
import { useStore } from '@/data/store';
import { colors, fonts, outline, radius } from '@/theme';

type Options = {
  userId: string;
  initial: SocialProfile | null;
  defaultName: string;
};

export function usePublicProfileEditor({ userId, initial, defaultName }: Options) {
  const { sessions } = useStore();
  const [username, setUsername] = useState(initial?.username ?? suggestUsername(defaultName));
  const [visibility, setVisibility] = useState<Visibility>(initial?.visibility ?? 'friends');
  const [taken, setTaken] = useState<boolean | null>(null);
  const [avatar, setAvatar] = useState<string | null>(initial?.avatar ?? null);

  const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
  const valid = isValidUsername(cleanUsername);
  const unchanged = cleanUsername === initial?.username;

  // Confere se o @ está livre (um pouco depois de parar de digitar).
  useEffect(() => {
    if (!valid || unchanged) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      findUser(cleanUsername)
        .then((found) => !cancelled && setTaken(Boolean(found)))
        .catch(() => !cancelled && setTaken(null));
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cleanUsername, valid, unchanged]);

  const status = !valid
    ? { text: 'Use de 3 a 20 letras minúsculas, números, ponto ou _', color: colors.textMuted }
    : unchanged
      ? null
      : taken === true
        ? { text: 'Este @ já está em uso', color: colors.danger }
        : taken === false
          ? { text: '✓ Disponível', color: colors.primary }
          : null;

  /** O que impede de salvar (ou null se está tudo certo). */
  const problem = !valid
    ? 'Escolha um nome de usuário (@) válido.'
    : !unchanged && taken === true
      ? 'Este @ já está em uso. Escolha outro.'
      : !unchanged && taken !== false
        ? 'Aguarde: conferindo se o @ está livre.'
        : null;

  /** Salva o @ e a privacidade; o nome no Clube acompanha o Nome do perfil. */
  async function save(name: string) {
    await saveMyProfile(userId, {
      username: cleanUsername,
      displayName: name.trim() || 'Atleta',
      visibility,
      showRecords: initial?.showRecords ?? true,
      avatar,
    });
    await updateMyStats(userId, computeStats(sessions, new Date())).catch(() => {});
  }

  const avatarElement = <AvatarPicker name={defaultName} value={avatar} onChange={setAvatar} />;

  const usernameElement = (
    <>
      <View style={styles.field}>
        <Text style={styles.at}>@</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={(v) => {
            setUsername(v.toLowerCase().replace(/[^a-z0-9._@]/g, ''));
            setTaken(null);
          }}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={21}
          placeholder="Nome de usuário"
          placeholderTextColor={colors.textFaint}
        />
      </View>
      {status && <Text style={[styles.status, { color: status.color }]}>{status.text}</Text>}
    </>
  );

  const visibilityElement = (
    <>
      <SectionTitle>Quem pode ver seu perfil</SectionTitle>
      <Card style={{ gap: 4 }}>
        {(
          [
            ['friends', 'Só amigos e quem está nos seus clubes'],
            ['everyone', 'Qualquer pessoa com o app'],
            ['nobody', 'Ninguém'],
          ] as const
        ).map(([key, label]) => (
          <Pressable key={key} style={styles.option} onPress={() => setVisibility(key)} accessibilityRole="radio">
            <Ionicons
              name={visibility === key ? 'radio-button-on' : 'radio-button-off'}
              size={22}
              color={visibility === key ? colors.primary : colors.textMuted}
            />
            <Text style={styles.optionText}>{label}</Text>
          </Pressable>
        ))}
      </Card>
    </>
  );

  return { avatarElement, usernameElement, visibilityElement, problem, save };
}

const styles = StyleSheet.create({
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
    paddingVertical: 13,
    paddingLeft: 4,
  },
  status: { fontFamily: fonts.semibold, fontSize: 13, marginTop: -4 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  optionText: { color: colors.text, fontFamily: fonts.regular, fontSize: 15 },
});
