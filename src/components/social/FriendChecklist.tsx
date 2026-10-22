// Lista dos amigos com caixinha para marcar: usada para colocar amigos num grupo
// (ao criar o grupo e depois, em "Adicionar amigos").

import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/social/Avatar';
import { Card } from '@/components/ui';
import { getProfiles, listFriendships } from '@/data/social';
import type { SocialProfile } from '@/data/social';
import { colors, fonts } from '@/theme';

type Props = {
  userId: string;
  /** Quem não aparece na lista (ex.: quem já está no grupo). */
  exclude?: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
};

export function FriendChecklist({ userId, exclude = [], selected, onChange }: Props) {
  const [friends, setFriends] = useState<SocialProfile[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    listFriendships(userId)
      .then(async (list) => {
        const ids = list.filter((f) => f.status === 'accepted').map((f) => f.otherId);
        const people = await getProfiles(ids);
        if (!cancelled) setFriends(ids.map((id) => people[id]).filter(Boolean));
      })
      .catch(() => !cancelled && setFriends([]));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (friends === null) return <ActivityIndicator color={colors.primary} />;

  const available = friends.filter((f) => !exclude.includes(f.userId));
  if (available.length === 0) {
    return (
      <Text style={styles.muted}>
        {friends.length === 0
          ? 'Você ainda não tem amigos. Adicione alguém na aba Amigos ou mande o código do grupo.'
          : 'Todos os seus amigos já estão no grupo.'}
      </Text>
    );
  }

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }

  return (
    <View style={{ gap: 8 }}>
      {available.map((friend) => {
        const on = selected.includes(friend.userId);
        return (
          <Pressable
            key={friend.userId}
            onPress={() => toggle(friend.userId)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}>
            <Card style={[styles.row, on && styles.rowOn]}>
              <Avatar name={friend.displayName} icon={friend.avatar} size={38} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{friend.displayName}</Text>
                <Text style={styles.muted}>@{friend.username}</Text>
              </View>
              <Ionicons
                name={on ? 'checkbox' : 'square-outline'}
                size={26}
                color={on ? colors.primary : colors.textMuted}
              />
            </Card>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  rowOn: { borderColor: colors.primary },
  name: { color: colors.text, fontFamily: fonts.bold, fontSize: 15 },
  muted: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
});
