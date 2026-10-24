import { BigShoulders_800ExtraBold } from '@expo-google-fonts/big-shoulders';
import {
  PublicSans_400Regular,
  PublicSans_500Medium,
  PublicSans_600SemiBold,
  PublicSans_700Bold,
} from '@expo-google-fonts/public-sans';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DialogHost } from '@/components/DialogHost';
import { LoginScreen } from '@/components/LoginScreen';
import { ProfileForm } from '@/components/ProfileForm';
import { PresenceSync } from '@/components/social/PresenceSync';
import { SocialStatsSync } from '@/components/social/SocialStatsSync';
import { AuthProvider, useAuth } from '@/data/auth';
import { ProfileProvider, useProfile } from '@/data/profile';
import { StoreProvider, useStore } from '@/data/store';
import { colors, fonts } from '@/theme';

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
    <>
      <SocialStatsSync />
      <PresenceSync />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: fonts.bold },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
          headerBackButtonDisplayMode: 'minimal',
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="treino/editar" options={{ title: 'Treino' }} />
        <Stack.Screen name="bloco/[id]" options={{ title: 'Bloco' }} />
        <Stack.Screen name="bloco/editar" options={{ title: 'Bloco de treino' }} />
        <Stack.Screen name="registrar/[id]" options={{ title: 'Registrar treino' }} />
        <Stack.Screen name="sessao/[id]" options={{ title: 'Treino realizado' }} />
        <Stack.Screen name="vitoria/[id]" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="exercicio/[id]" options={{ title: 'Progressão' }} />
        <Stack.Screen name="configuracoes" options={{ title: 'Configurações' }} />
        <Stack.Screen name="editar-perfil" options={{ title: 'Editar perfil' }} />
        <Stack.Screen name="alterar-senha" options={{ title: 'Alterar senha' }} />
        <Stack.Screen name="excluir-conta" options={{ title: 'Excluir conta' }} />
        <Stack.Screen name="privacidade" options={{ title: 'Política de privacidade' }} />
        <Stack.Screen name="frank" options={{ title: 'Evoluções do Frank' }} />
        <Stack.Screen name="amigos/adicionar" options={{ title: 'Adicionar amigo' }} />
        <Stack.Screen name="usuario/[id]" options={{ title: 'Perfil' }} />
        <Stack.Screen name="bloqueados" options={{ title: 'Pessoas bloqueadas' }} />
        <Stack.Screen name="clubes/novo" options={{ title: 'Novo grupo' }} />
        <Stack.Screen name="clubes/[id]" options={{ title: 'Grupo' }} />
        <Stack.Screen name="clubes/info/[id]" options={{ title: 'Grupo' }} />
        <Stack.Screen name="conversa/[id]" options={{ title: 'Mensagens' }} />
        <Stack.Screen name="convite/[code]" options={{ title: 'Convite' }} />
      </Stack>
    </>
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
  const [fontsLoaded, fontError] = useFonts({
    BigShoulders_800ExtraBold,
    PublicSans_400Regular,
    PublicSans_500Medium,
    PublicSans_600SemiBold,
    PublicSans_700Bold,
    JetBrainsMono_500Medium,
  });
  // Se as fontes falharem, o app abre mesmo assim com a fonte do sistema.
  if (!fontsLoaded && !fontError) return <Loading />;

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <AuthGate />
      <DialogHost />
    </AuthProvider>
  );
}
