import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs, router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { useStore } from '@/data/store';
import { colors, statusColors } from '@/theme';

/** Botão da conta no topo; o pontinho avisa se há algo não sincronizado. */
function AccountButton() {
  const { sync } = useStore();
  const warn = sync.pending > 0 || sync.status === 'offline' || sync.status === 'erro';
  return (
    <Pressable
      onPress={() => router.push('/conta')}
      hitSlop={10}
      accessibilityLabel="Minha conta"
      style={{ marginRight: 16 }}>
      <Ionicons name="person-circle-outline" size={28} color={colors.textMuted} />
      {warn && (
        <View
          style={{
            position: 'absolute',
            top: 1,
            right: 1,
            width: 9,
            height: 9,
            borderRadius: 5,
            backgroundColor: sync.status === 'erro' ? colors.danger : statusColors.manteve,
            borderWidth: 1.5,
            borderColor: colors.background,
          }}
        />
      )}
    </Pressable>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '800', fontSize: 22 },
        headerShadowVisible: false,
        headerRight: () => <AccountButton />,
        sceneStyle: { backgroundColor: colors.background },
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Treinos',
          tabBarIcon: ({ color, size }) => <Ionicons name="barbell" size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="progresso"
        options={{
          title: 'Progresso',
          tabBarIcon: ({ color, size }) => <Ionicons name="trending-up" size={size} color={color as string} />,
        }}
      />
    </Tabs>
  );
}
