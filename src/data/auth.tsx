// Login: e-mail e senha (com confirmação por código), recuperação de senha e Google.

import type { Session } from '@supabase/supabase-js';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

type Auth = {
  loading: boolean;
  session: Session | null;
  /** true enquanto a pessoa está definindo uma nova senha (não entra no app ainda). */
  recoveringPassword: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  /** Retorna true se a conta precisa ser confirmada com o código enviado por e-mail. */
  signUp: (email: string, password: string, name: string, birthDate: string, username: string) => Promise<boolean>;
  confirmEmail: (email: string, code: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Confere a senha atual antes de trocar (protege um celular desbloqueado nas mãos de outra pessoa). */
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  /** Apaga a conta e todos os dados dela no banco (depois, chame signOut). */
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<Auth | null>(null);

/** Transforma os erros do Supabase em mensagens em português. */
export function authErrorMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();
  if (lower.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (lower.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if (lower.includes('already registered') || lower.includes('already been registered'))
    return 'Este e-mail já tem uma conta. Tente entrar.';
  if (lower.includes('different from the old')) return 'A nova senha precisa ser diferente da atual.';
  if (lower.includes('password should be') || lower.includes('weak password'))
    return 'A senha precisa ter pelo menos 6 caracteres.';
  if (lower.includes('expired') || (lower.includes('invalid') && lower.includes('token')))
    return 'Código inválido ou expirado. Peça um novo.';
  if (lower.includes('rate limit') || lower.includes('too many'))
    return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.';
  if (lower.includes('valid email') || lower.includes('invalid format')) return 'Digite um e-mail válido.';
  if (lower.includes('network') || lower.includes('fetch')) return 'Sem conexão com a internet.';
  return msg;
}

function paramsFromUrl(url: string) {
  const params: Record<string, string> = {};
  const parts = [url.split('?')[1]?.split('#')[0], url.split('#')[1]].filter(Boolean) as string[];
  for (const part of parts) new URLSearchParams(part).forEach((value, key) => (params[key] = value));
  return params;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recoveringPassword, setRecoveringPassword] = useState(false);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .finally(() => setLoading(false));
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession));
    return () => data.subscription.unsubscribe();
  }, []);

  const auth = useMemo<Auth>(
    () => ({
      loading,
      session,
      recoveringPassword,

      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      },

      signUp: async (email, password, name, birthDate, username) => {
        // Nome, nascimento e @ vão como metadados; o banco cria o perfil e o perfil do Clube a partir deles.
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { name: name.trim(), birth_date: birthDate, username } },
        });
        if (error) throw error;
        // Se a conta já existe, o Supabase devolve um usuário sem identidades.
        if (data.user && data.user.identities?.length === 0) throw new Error('User already registered');
        return !data.session;
      },

      confirmEmail: async (email, code) => {
        const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
        if (!error) return;
        const retry = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'signup' });
        if (retry.error) throw error;
      },

      resendConfirmation: async (email) => {
        const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
        if (error) throw error;
      },

      sendPasswordReset: async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
        if (error) throw error;
      },

      resetPassword: async (email, code, newPassword) => {
        setRecoveringPassword(true);
        try {
          const { error } = await supabase.auth.verifyOtp({
            email: email.trim(),
            token: code.trim(),
            type: 'recovery',
          });
          if (error) throw error;
          const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
          if (updateError) {
            await supabase.auth.signOut({ scope: 'local' });
            throw updateError;
          }
        } finally {
          setRecoveringPassword(false);
        }
      },

      // Login com Google: pronto, mas sem botão no app por enquanto (falta publicar o app no Google Cloud).
      signInWithGoogle: async () => {
        if (Platform.OS === 'web') {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin },
          });
          if (error) throw error;
          return;
        }
        const redirectTo = makeRedirectUri();
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo, skipBrowserRedirect: true },
        });
        if (error) throw error;
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type !== 'success') return; // a pessoa fechou a janela

        const params = paramsFromUrl(result.url);
        if (params.error_description || params.error) throw new Error(params.error_description ?? params.error);
        if (params.code) {
          const { error: codeError } = await supabase.auth.exchangeCodeForSession(params.code);
          if (codeError) throw codeError;
        } else if (params.access_token && params.refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          if (sessionError) throw sessionError;
        }
      },

      signOut: async () => {
        await supabase.auth.signOut({ scope: 'local' });
      },

      changePassword: async (currentPassword, newPassword) => {
        const email = session?.user.email;
        if (!email) throw new Error('Not authenticated');
        const { error: checkError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
        if (checkError) throw new Error('Senha atual incorreta.');
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
      },

      deleteAccount: async () => {
        const { error } = await supabase.rpc('delete_my_account');
        if (error) throw error;
      },
    }),
    [loading, session, recoveringPassword]
  );

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return auth;
}
