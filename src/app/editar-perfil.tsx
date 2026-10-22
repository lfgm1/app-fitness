import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator } from 'react-native';

import { ProfileForm } from '@/components/ProfileForm';
import { usePublicProfileEditor } from '@/components/social/PublicProfileFields';
import { EmptyState } from '@/components/ui';
import { useAuth } from '@/data/auth';
import { useProfile } from '@/data/profile';
import type { Profile } from '@/data/profile';
import { getProfile } from '@/data/social';
import type { SocialProfile } from '@/data/social';
import { colors } from '@/theme';

/** Editar perfil: dados pessoais e perfil público (@, nome para os amigos e privacidade) numa tela só. */
export default function EditProfileScreen() {
  const { session } = useAuth();
  const { profile } = useProfile();
  const userId = session!.user.id;
  const [publicProfile, setPublicProfile] = useState<SocialProfile | null | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      getProfile(userId)
        .then(setPublicProfile)
        .catch(() => setPublicProfile(null));
    }, [userId])
  );

  if (!profile) {
    return (
      <EmptyState
        icon="cloud-offline-outline"
        title="Perfil indisponível"
        text="Conecte-se à internet para carregar seu perfil."
      />
    );
  }
  if (publicProfile === undefined) return <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />;

  return <EditForm userId={userId} profile={profile} publicProfile={publicProfile} />;
}

function EditForm({
  userId,
  profile,
  publicProfile,
}: {
  userId: string;
  profile: Profile;
  publicProfile: SocialProfile | null;
}) {
  const { saveProfile } = useProfile();
  const extra = usePublicProfileEditor({ userId, initial: publicProfile, defaultName: profile.name ?? '' });

  async function save(next: Profile) {
    await saveProfile(next);
    router.back();
  }

  return <ProfileForm initial={profile} mode="edit" onSave={save} extra={extra} />;
}
