import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs, router } from 'expo-router';
import { Pressable } from 'react-native';

import { FloatingTabBar } from '@/components/FloatingTabBar';
import { Logo } from '@/components/Logo';
import { colors, fonts } from '@/theme';

function SettingsButton() {
  return (
    <Pressable
      onPress={() => router.push('/configuracoes')}
      hitSlop={10}
      accessibilityLabel="Configurações"
      style={{ marginRight: 16 }}>
      <Ionicons name="settings-outline" size={24} color={colors.textMuted} />
    </Pressable>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      // Barra flutuante em pílula, só com ícones (src/components/FloatingTabBar.tsx).
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fonts.display, textTransform: 'uppercase', letterSpacing: 0.4, fontSize: 28 },
        headerShadowVisible: false,
        headerRight: () => <SettingsButton />,
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          headerTitle: () => <Logo size={38} />,
          headerTitleAlign: 'left',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="treinos"
        options={{
          title: 'Treinos',
          tabBarIcon: ({ color, size }) => <Ionicons name="barbell" size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="passos"
        options={{
          title: 'Passos',
          tabBarIcon: ({ color, size }) => <Ionicons name="footsteps" size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="calorias"
        options={{
          title: 'Calorias',
          tabBarIcon: ({ color, size }) => <Ionicons name="restaurant" size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="clube"
        options={{
          title: 'Social',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color as string} />,
        }}
      />
    </Tabs>
  );
}
