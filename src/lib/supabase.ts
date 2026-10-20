// Conexão com o Supabase (banco de dados + login).
// As chaves vêm do arquivo .env na raiz do projeto.

import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '';

/** false enquanto o .env não estiver preenchido. */
export const isSupabaseConfigured = url.startsWith('https://') && key.length > 20;

export const supabase = createClient(
  isSupabaseConfigured ? url : 'https://nao-configurado.supabase.co',
  isSupabaseConfigured ? key : 'nao-configurado',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // No navegador, o login com Google volta para a página com a sessão na URL.
      detectSessionInUrl: Platform.OS === 'web',
    },
  }
);

// No celular, só renova o login enquanto o app está aberto na tela.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
