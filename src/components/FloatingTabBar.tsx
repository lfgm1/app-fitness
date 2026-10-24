// Barra de abas flutuante: uma pílula escura acima da borda da tela, só com ícones. A aba ativa
// ganha um fundo claro arredondado; a aba Perfil mostra o ícone de perfil da pessoa.

import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarCircle } from '@/components/social/Avatar';
import { useAuth } from '@/data/auth';
import { useProfile } from '@/data/profile';
import { getProfile } from '@/data/social';
import { colors } from '@/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// Ícone de cada aba: [ativa, inativa].
const ICONS: Record<string, [IconName, IconName]> = {
  index: ['home', 'home-outline'],
  treinos: ['barbell', 'barbell-outline'],
  passos: ['footsteps', 'footsteps-outline'],
  calorias: ['restaurant', 'restaurant-outline'],
  clube: ['people', 'people-outline'],
};

/** Ícone de perfil da pessoa (o do Social; sem ele, a inicial do nome). */
function useMyAvatar() {
  const { session } = useAuth();
  const { profile } = useProfile();
  const userId = session?.user.id;
  const [avatar, setAvatar] = useState<string | null>(null);
  useEffect(() => {
    if (!userId) return;
    getProfile(userId)
      .then((p) => setAvatar(p?.avatar ?? null))
      .catch(() => {});
  }, [userId]);
  return { name: profile?.name ?? undefined, avatar };
}

export function FloatingTabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const me = useMyAvatar();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const onPress = () => {
            const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigateToTab(route.key);
          };
          const icons = ICONS[route.name];
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
              style={[styles.slot, focused && styles.slotOn]}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={typeof options.title === 'string' ? options.title : route.name}>
              {icons ? (
                <Ionicons
                  name={focused ? icons[0] : icons[1]}
                  size={23}
                  color={focused ? colors.text : colors.textMuted}
                />
              ) : (
                // Perfil: o ícone da pessoa, com um anel quando a aba está ativa.
                <View style={[styles.avatarRing, focused && { borderColor: colors.text }]}>
                  <AvatarCircle name={me.name} icon={me.avatar} size={24} />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.background, paddingHorizontal: 12, paddingTop: 6 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 58,
    paddingHorizontal: 6,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  slot: { width: 50, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  slotOn: { backgroundColor: '#3A3D46' },
  avatarRing: { borderRadius: 999, borderWidth: 2, borderColor: 'transparent', padding: 1 },
});
