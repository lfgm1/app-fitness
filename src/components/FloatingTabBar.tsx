// Barra de abas flutuante: uma pílula escura acima da borda da tela, só com ícones. A aba ativa
// ganha um fundo claro arredondado; a aba Perfil mostra o ícone de perfil da pessoa.
// Ao trocar de aba, o fundo claro desliza até a aba nova (com uma leve mola) e o ícone dá um pulinho.

import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';
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

const SLOT_W = 50;
const SLOT_H = 44;
// No navegador as animações rodam em JavaScript (o "native driver" só existe no celular).
const NATIVE = Platform.OS !== 'web';
// No navegador, o deslizar do destaque é uma transição do próprio navegador (CSS): a animação em
// JavaScript às vezes parava no meio quando a tela nova era pesada (ex.: a Início).
const WEB_SLIDE = {
  transitionProperty: 'transform',
  transitionDuration: '320ms',
  transitionTimingFunction: 'cubic-bezier(0.34, 1.4, 0.64, 1)',
} as unknown as ViewStyle;

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

/** O ícone da aba: quando ela fica ativa, cresce um pouco e volta (o "pulinho"). */
function PopIcon({ focused, children }: { focused: boolean; children: ReactNode }) {
  const [scale] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (!focused) return;
    scale.setValue(0.75);
    Animated.spring(scale, { toValue: 1, friction: 4, tension: 160, useNativeDriver: NATIVE }).start();
  }, [focused, scale]);
  return <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>;
}

export function FloatingTabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const me = useMyAvatar();
  // Posição (x) de cada aba na barra, medida na tela, e o fundo claro que desliza entre elas.
  const [slots, setSlots] = useState<Record<number, number>>({});
  const [slider] = useState(() => new Animated.Value(0));
  const placed = useRef(false);

  useEffect(() => {
    const x = slots[state.index];
    if (x === undefined || !NATIVE) return;
    if (!placed.current) {
      // Primeira vez: já aparece no lugar, sem deslizar.
      placed.current = true;
      slider.setValue(x);
      return;
    }
    Animated.spring(slider, { toValue: x, friction: 8, tension: 90, useNativeDriver: NATIVE }).start();
  }, [state.index, slots, slider]);

  const measured = slots[state.index] !== undefined;

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar}>
        {measured &&
          (NATIVE ? (
            <Animated.View pointerEvents="none" style={[styles.slider, { transform: [{ translateX: slider }] }]} />
          ) : (
            <View
              pointerEvents="none"
              style={[styles.slider, WEB_SLIDE, { transform: [{ translateX: slots[state.index] }] }]}
            />
          ))}
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
              onLayout={(e) => {
                const x = e.nativeEvent.layout.x;
                setSlots((prev) => (prev[index] === x ? prev : { ...prev, [index]: x }));
              }}
              style={styles.slot}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={typeof options.title === 'string' ? options.title : route.name}>
              <PopIcon focused={focused}>
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
              </PopIcon>
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
  slot: { width: SLOT_W, height: SLOT_H, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  // O fundo claro da aba ativa (fica atrás dos ícones e desliza de uma aba para a outra).
  slider: {
    position: 'absolute',
    left: 0,
    top: '50%',
    marginTop: -SLOT_H / 2,
    width: SLOT_W,
    height: SLOT_H,
    borderRadius: 999,
    backgroundColor: '#3A3D46',
  },
  avatarRing: { borderRadius: 999, borderWidth: 2, borderColor: 'transparent', padding: 1 },
});
