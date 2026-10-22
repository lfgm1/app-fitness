import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';

import { ChatHeader } from '@/components/social/ChatHeader';
import { GroupIcon } from '@/components/social/GroupIcon';
import { ChatView } from '@/components/social/ChatView';
import { useAuth } from '@/data/auth';
import { getProfiles, listClubMembers, listMyClubs } from '@/data/social';
import type { Club } from '@/data/social';

/** Chat do grupo. Tocar no topo abre membros e convite. */
export default function ClubChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const userId = session!.user.id;
  const [club, setClub] = useState<Club | null>(null);
  const [memberNames, setMemberNames] = useState('');

  useFocusEffect(
    useCallback(() => {
      listMyClubs()
        .then((clubs) => {
          const found = clubs.find((c) => c.id === id) ?? null;
          // Saiu ou foi removido do grupo: volta para a lista.
          if (!found) router.back();
          setClub(found);
        })
        .catch(() => {});
      // "Ana, Bruno, Você" embaixo do nome do grupo.
      listClubMembers(id)
        .then(async (members) => {
          const people = await getProfiles(members.map((m) => m.userId));
          const others = members
            .filter((m) => m.userId !== userId)
            .map((m) => people[m.userId]?.displayName)
            .filter(Boolean)
            .sort((a, b) => a!.localeCompare(b!));
          setMemberNames([...others, 'Você'].join(', '));
        })
        .catch(() => {});
    }, [id, userId])
  );

  const openInfo = () => router.push({ pathname: '/clubes/info/[id]', params: { id } });

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <ChatHeader
              icon={<GroupIcon icon={club?.icon} emoji={club?.emoji} />}
              title={club?.name ?? 'Grupo'}
              subtitle={memberNames}
              onPress={openInfo}
            />
          ),
        }}
      />
      <ChatView userId={userId} target={{ clubId: id }} />
    </>
  );
}
