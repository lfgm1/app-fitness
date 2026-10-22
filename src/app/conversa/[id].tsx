import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';

import { Avatar } from '@/components/social/Avatar';
import { ChatHeader } from '@/components/social/ChatHeader';
import { ChatView } from '@/components/social/ChatView';
import { useAuth } from '@/data/auth';
import { getProfile } from '@/data/social';
import type { SocialProfile } from '@/data/social';

/** Conversa no privado com um amigo. O topo abre o perfil dele. */
export default function DirectChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const [peer, setPeer] = useState<SocialProfile | null>(null);

  useFocusEffect(
    useCallback(() => {
      getProfile(id)
        .then(setPeer)
        .catch(() => {});
    }, [id])
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <ChatHeader
              icon={<Avatar name={peer?.displayName} icon={peer?.avatar} size={38} />}
              title={peer?.displayName ?? 'Mensagens'}
              subtitle={peer ? `@${peer.username}` : undefined}
              onPress={() => router.push({ pathname: '/usuario/[id]', params: { id } })}
            />
          ),
        }}
      />
      <ChatView userId={session!.user.id} target={{ peerId: id }} />
    </>
  );
}
