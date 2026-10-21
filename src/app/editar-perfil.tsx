import { router } from 'expo-router';

import { ProfileForm } from '@/components/ProfileForm';
import { EmptyState } from '@/components/ui';
import { useProfile } from '@/data/profile';
import type { Profile } from '@/data/profile';

export default function EditProfileScreen() {
  const { profile, saveProfile } = useProfile();

  if (!profile) {
    return (
      <EmptyState
        icon="cloud-offline-outline"
        title="Perfil indisponível"
        text="Conecte-se à internet para carregar seu perfil."
      />
    );
  }

  async function save(next: Profile) {
    await saveProfile(next);
    router.back();
  }

  return <ProfileForm initial={profile} mode="edit" onSave={save} />;
}
