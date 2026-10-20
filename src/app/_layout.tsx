import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';

import { LoginScreen } from '@/components/LoginScreen';
import { AuthProvider, useAuth } from '@/data/auth';
import { StoreProvider, useStore } from '@/data/store';
import { colors } from '@/theme';

function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

function Navigator() {
  const { loaded } = useStore();
  if (!loaded) return <Loading />;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
        headerBackButtonDisplayMode: 'minimal',
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="treino/editar" options={{ title: 'Treino' }} />
      <Stack.Screen name="registrar/[id]" options={{ title: 'Registrar treino' }} />
      <Stack.Screen name="sessao/[id]" options={{ title: 'Treino realizado' }} />
      <Stack.Screen name="exercicio/[id]" options={{ title: 'Progressão' }} />
      <Stack.Screen name="conta" options={{ title: 'Minha conta' }} />
    </Stack>
  );
}

/** Mostra o login enquanto a pessoa não entrou; depois, o app com os dados dela. */
function AuthGate() {
  const { loading, session, recoveringPassword } = useAuth();
  if (loading) return <Loading />;
  if (!session || recoveringPassword) return <LoginScreen />;
  return (
    <StoreProvider key={session.user.id} userId={session.user.id}>
      <Navigator />
    </StoreProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <AuthGate />
    </AuthProvider>
  );
}
