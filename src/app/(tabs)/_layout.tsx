import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs, router } from 'expo-router';
import { Platform, Pressable } from 'react-native';

import { Logo } from '@/components/Logo';
import { colors, fonts, outlineColor, outlineWidth } from '@/theme';

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

// No navegador (site / app instalado pela tela de início) a barra de abas tem altura fixa e
// cortava o nome das abas; aqui ela ganha altura própria. No app nativo a navegação calcula sozinha.
const webTabBar = Platform.OS === 'web' ? { height: 64, paddingTop: 6, paddingBottom: 8 } : null;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fonts.display, textTransform: 'uppercase', letterSpacing: 0.4, fontSize: 28 },
        headerShadowVisible: false,
        headerRight: () => <SettingsButton />,
        sceneStyle: { backgroundColor: colors.background },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: outlineColor,
          borderTopWidth: outlineWidth,
          ...webTabBar,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16 },
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
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color as string} />,
        }}
      />
    </Tabs>
  );
}
