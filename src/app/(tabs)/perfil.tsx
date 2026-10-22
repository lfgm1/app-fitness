import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/social/Avatar';
import { PhaseTag, ProfileStats } from '@/components/social/ProfileSummary';
import { Button, Card, EmptyState, SectionTitle } from '@/components/ui';
import { useAuth } from '@/data/auth';
import { EXPERIENCE_HINTS, EXPERIENCE_LABELS, SEX_LABELS, useProfile } from '@/data/profile';
import { VISIBILITY_LABELS, getProfile, inviteLink, shareText } from '@/data/social';
import type { SocialProfile } from '@/data/social';
import { ageFrom, formatBirthDate, notify } from '@/lib/format';
import { kgToUnit, useUnits } from '@/lib/units';
import { colors, fonts, outlineColor } from '@/theme';

function formatSteps(n: number) {
  return String(n).replace(/\B(?=(\d{3})+$)/g, '.');
}

export default function ProfileScreen() {
  const { session } = useAuth();
  const { profile } = useProfile();
  const units = useUnits();
  const userId = session?.user.id;
  // Perfil público (o @ e o que os amigos veem). Recarrega ao voltar da tela de edição.
  const [publicProfile, setPublicProfile] = useState<SocialProfile | null>(null);
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      getProfile(userId)
        .then(setPublicProfile)
        .catch(() => {});
    }, [userId])
  );

  async function shareCode() {
    if (!publicProfile) return;
    const how = await shareText(
      `Bora treinar junto no Gains Club! Me adiciona: ${inviteLink(publicProfile.friendCode)} (ou use o código ${publicProfile.friendCode})`
    ).catch(() => null);
    if (how === 'copiado') notify('Link copiado', 'Cole na conversa com seu amigo.');
  }

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
    ['Nome', profile.name ?? null],
    ['Nome de usuário', publicProfile ? `@${publicProfile.username}` : null],
    [
      'Data de nascimento',
      profile.birthDate ? `${formatBirthDate(profile.birthDate)} (${ageFrom(profile.birthDate)} anos)` : null,
    ],
    ['E-mail', session?.user.email ?? null],
    ['Sexo', profile.sex ? SEX_LABELS[profile.sex] : null],
    ['Altura', profile.heightCm ? `${profile.heightCm} cm` : null],
    ['Peso', profile.weightKg ? `${Math.round(kgToUnit(profile.weightKg, units.unit))} ${units.unit}` : null],
    [
      'Experiência',
      profile.experience ? `${EXPERIENCE_LABELS[profile.experience]} · ${EXPERIENCE_HINTS[profile.experience]}` : null,
    ],
    ['Meta diária de passos', profile.dailyStepGoal ? `${formatSteps(profile.dailyStepGoal)} passos` : null],
    ['Quem pode ver seu perfil', publicProfile ? VISIBILITY_LABELS[publicProfile.visibility] : null],
  ];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Avatar name={profile.name ?? session?.user.email} icon={publicProfile?.avatar} size={88} />
        </View>
        <Text style={styles.name}>{profile.name ?? 'Sem nome'}</Text>
        {publicProfile && <Text style={styles.username}>@{publicProfile.username}</Text>}
        {publicProfile && publicProfile.visibility !== 'nobody' && <PhaseTag person={publicProfile} />}
        {publicProfile && (
          <Pressable style={styles.codePill} onPress={shareCode} accessibilityLabel="Compartilhar código de amigo">
            <Text style={styles.codeLabel}>Código de amigo</Text>
            <Text style={styles.code}>{publicProfile.friendCode}</Text>
            <Ionicons name="share-social-outline" size={16} color={colors.primaryText} />
          </Pressable>
        )}
      </View>

      {publicProfile && (
        <>
          {publicProfile.visibility === 'nobody' ? (
            <Text style={styles.hint}>
              Seu perfil está privado: ninguém vê seu Frank nem seus números. Amigos e clubes só veem seu nome e @ nas
              conversas.
            </Text>
          ) : (
            <>
              <ProfileStats person={publicProfile} />
              <View style={styles.visibility}>
                <Ionicons name="eye-outline" size={15} color={colors.textMuted} />
                <Text style={styles.hint}>
                  Visível para: {VISIBILITY_LABELS[publicProfile.visibility].toLowerCase()}
                </Text>
              </View>
            </>
          )}
        </>
      )}

      <SectionTitle>Seus dados</SectionTitle>
      <Card style={{ padding: 0 }}>
        {/* Aqui ficam só os primeiros dados; todos aparecem em "Editar perfil". */}
        {rows.slice(0, 3).map(([label, value], index) => (
          <View key={label} style={[styles.row, index > 0 && styles.divider]}>
            <Text style={styles.label}>{label}</Text>
            <Text style={[styles.value, !value && styles.empty]}>{value ?? 'Não informado'}</Text>
          </View>
        ))}
      </Card>

      <Button
        title="Editar perfil"
        icon="create-outline"
        variant="secondary"
        onPress={() => router.push('/editar-perfil')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  header: { alignItems: 'center', paddingVertical: 12, gap: 4 },
  avatar: { marginBottom: 8 },
  visibility: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hint: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  name: { color: colors.text, fontSize: 28, fontFamily: fonts.display, textTransform: 'uppercase', letterSpacing: 0.4 },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: outlineColor,
  },
  codeLabel: { color: colors.primaryText, fontFamily: fonts.semibold, fontSize: 13 },
  code: { color: colors.primaryText, fontFamily: fonts.mono, fontSize: 15, letterSpacing: 2 },
  username: { color: colors.primary, fontFamily: fonts.bold, fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  label: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 15, flex: 1 },
  value: { color: colors.text, fontSize: 15, fontFamily: fonts.semibold, textAlign: 'right', flexShrink: 1 },
  empty: { color: colors.textFaint, fontFamily: fonts.regular },
});
