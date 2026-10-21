import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoginScreen } from '@/components/LoginScreen';
import { ProfileForm } from '@/components/ProfileForm';
import { AuthProvider, useAuth } from '@/data/auth';
import { ProfileProvider, useProfile } from '@/data/profile';
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
  const { profile, loaded: profileLoaded, saveProfile } = useProfile();
  if (!loaded || (!profileLoaded && !profile)) return <Loading />;

  // Logo após criar a conta (ou no primeiro login com Google): completar o perfil.
  if (profile && !profile.onboardingCompleted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ProfileForm initial={profile} mode="onboarding" onSave={saveProfile} />
      </SafeAreaView>
    );
  }

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
      <Stack.Screen name="configuracoes" options={{ title: 'Configurações' }} />
      <Stack.Screen name="editar-perfil" options={{ title: 'Editar perfil' }} />
      <Stack.Screen name="alterar-senha" options={{ title: 'Alterar senha' }} />
      <Stack.Screen name="excluir-conta" options={{ title: 'Excluir conta' }} />
      <Stack.Screen name="privacidade" options={{ title: 'Política de privacidade' }} />
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
      <ProfileProvider key={session.user.id} userId={session.user.id}>
        <Navigator />
      </ProfileProvider>
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
