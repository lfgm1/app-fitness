import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FrankHead } from '@/components/Frank';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui';
import { authErrorMessage, useAuth } from '@/data/auth';
import { isValidUsername, usernameAvailable } from '@/data/social';
import { ageFrom, maskDate, parseBirthDate } from '@/lib/format';
import { isSupabaseConfigured } from '@/lib/supabase';
import { colors, fonts, hardShadow, outline, outlineColor, radius } from '@/theme';

const MIN_AGE = 13;

type Mode = 'entrar' | 'criar' | 'confirmar' | 'recuperar' | 'nova-senha';

// Título em estilo pôster: as duas primeiras linhas em letras grandes e a última numa etiqueta verde.
const TITLES: Record<Mode, { poster: [string, string, string]; subtitle: string }> = {
  entrar: {
    poster: ['Bem-vindo', 'ao', 'clube'],
    subtitle: 'Seus treinos ficam salvos na sua conta, em qualquer celular.',
  },
  criar: { poster: ['Entre', 'para o', 'clube'], subtitle: 'Leva menos de um minuto.' },
  confirmar: { poster: ['Confirme', 'seu', 'e-mail'], subtitle: 'Enviamos um código para o seu e-mail.' },
  recuperar: { poster: ['Esqueceu', 'a', 'senha?'], subtitle: 'Vamos enviar um código para o seu e-mail.' },
  'nova-senha': {
    poster: ['Crie uma', 'nova', 'senha'],
    subtitle: 'Digite o código que enviamos e escolha uma nova senha.',
  },
};

export function LoginScreen() {
  const auth = useAuth();
  const [mode, setMode] = useState<Mode>('entrar');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [birth, setBirth] = useState('');
  // O @ do Clube, escolhido no cadastro (não pode repetir).
  const [username, setUsername] = useState('');
  const [usernameFree, setUsernameFree] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function go(next: Mode) {
    setMode(next);
    setError(null);
    setInfo(null);
    setCode('');
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await action();
    } catch (err) {
      const message = authErrorMessage(err);
      setError(message);
      if (message.startsWith('Confirme seu e-mail')) setMode('confirmar');
    } finally {
      setBusy(false);
    }
  }

  const validEmail = /\S+@\S+\.\S+/.test(email.trim());

  // Cadastro: nome e data de nascimento (idade mínima de 13 anos).
  const birthIso = parseBirthDate(birth);
  const age = birthIso ? ageFrom(birthIso) : null;
  const birthError =
    birth.length < 10
      ? null
      : !birthIso || age === null || age > 110
        ? 'Data de nascimento inválida.'
        : age < MIN_AGE
          ? `É preciso ter pelo menos ${MIN_AGE} anos.`
          : null;
  const validUsername = isValidUsername(username);
  const validSignup =
    name.trim().length >= 2 && birthIso !== null && birthError === null && validUsername && usernameFree === true;

  // Confere se o @ está livre um pouco depois de a pessoa parar de digitar.
  useEffect(() => {
    if (mode !== 'criar' || !validUsername) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      usernameAvailable(username)
        .then((free) => !cancelled && setUsernameFree(free))
        .catch(() => !cancelled && setUsernameFree(null));
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [mode, username, validUsername]);

  const usernameHint =
    username.length === 0
      ? null
      : !validUsername
        ? { text: 'De 3 a 20 letras minúsculas, números, ponto ou _', color: colors.textMuted }
        : usernameFree === false
          ? { text: 'Este @ já está em uso. Escolha outro.', color: colors.danger }
          : usernameFree === true
            ? { text: '✓ Disponível', color: colors.primary }
            : null;

  const submit = {
    entrar: () => run(() => auth.signIn(email, password)),
    criar: () =>
      run(async () => {
        const needsConfirmation = await auth.signUp(email, password, name, birthIso!, username);
        if (needsConfirmation) go('confirmar');
      }),
    confirmar: () => run(() => auth.confirmEmail(email, code)),
    recuperar: () =>
      run(async () => {
        await auth.sendPasswordReset(email);
        go('nova-senha');
      }),
    'nova-senha': () => run(() => auth.resetPassword(email, code, password)),
  }[mode];

  const canSubmit =
    isSupabaseConfigured &&
    !busy &&
    validEmail &&
    (mode === 'recuperar' ||
      (mode === 'confirmar' && code.trim().length >= 6) ||
      (mode === 'entrar' && password.length >= 6) ||
      (mode === 'criar' && password.length >= 6 && validSignup) ||
      (mode === 'nova-senha' && code.trim().length >= 6 && password.length >= 6));

  const submitLabel = {
    entrar: 'Entrar',
    criar: 'Criar conta',
    confirmar: 'Confirmar',
    recuperar: 'Enviar código',
    'nova-senha': 'Salvar nova senha',
  }[mode];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Logo size={64} />
        <View style={styles.poster} accessibilityRole="header">
          <Text style={styles.posterText}>{TITLES[mode].poster[0]}</Text>
          <Text style={styles.posterText}>{TITLES[mode].poster[1]}</Text>
          <View style={styles.posterTag}>
            <Text style={[styles.posterText, styles.posterTagText]}>{TITLES[mode].poster[2]}</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>
          {TITLES[mode].subtitle}
          {(mode === 'confirmar' || mode === 'nova-senha') && email ? `\n${email.trim()}` : ''}
        </Text>

        {!isSupabaseConfigured && (
          <View style={styles.warning}>
            <Ionicons name="warning-outline" size={18} color={colors.danger} />
            <Text style={styles.warningText}>
              Banco de dados não configurado. Preencha o arquivo .env com as chaves do Supabase e reinicie o app.
            </Text>
          </View>
        )}

        {/* Formulário num card, com o Frank espiando por cima */}
        <View style={styles.formWrap}>
          <View style={styles.peek}>
            <FrankHead size={64} />
          </View>
          <View style={styles.form}>
            {mode === 'criar' && (
              <>
                <Field
                  icon="person-outline"
                  value={name}
                  onChangeText={setName}
                  placeholder="Nome"
                  autoCapitalize="words"
                  autoComplete="name"
                  textContentType="name"
                  maxLength={100}
                />
                <Field
                  icon="at-outline"
                  value={username}
                  onChangeText={(v) => {
                    setUsername(v.toLowerCase().replace(/[^a-z0-9._]/g, ''));
                    setUsernameFree(null);
                  }}
                  placeholder="Nome de usuário (seu @)"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username-new"
                  maxLength={20}
                />
                {usernameHint && <Text style={[styles.fieldHint, { color: usernameHint.color }]}>{usernameHint.text}</Text>}
                <Field
                  icon="calendar-outline"
                  value={birth}
                  onChangeText={(v) => setBirth(maskDate(v))}
                  placeholder="Data de nascimento (DD/MM/AAAA)"
                  keyboardType="number-pad"
                  autoComplete="birthdate-full"
                  maxLength={10}
                />
                {birthError && <Text style={styles.fieldError}>{birthError}</Text>}
              </>
            )}

            {mode !== 'confirmar' && mode !== 'nova-senha' && (
              <Field
                icon="mail-outline"
                value={email}
                onChangeText={setEmail}
                placeholder="E-mail"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
              />
            )}

            {(mode === 'confirmar' || mode === 'nova-senha') && (
              <Field
                icon="keypad-outline"
                value={code}
                onChangeText={(v) => setCode(v.replace(/\D/g, ''))}
                placeholder="Código do e-mail"
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                maxLength={10}
              />
            )}

            {(mode === 'entrar' || mode === 'criar' || mode === 'nova-senha') && (
              <Field
                icon="lock-closed-outline"
                value={password}
                onChangeText={setPassword}
                placeholder={mode === 'nova-senha' ? 'Nova senha (mín. 6 caracteres)' : 'Senha (mín. 6 caracteres)'}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete={mode === 'entrar' ? 'current-password' : 'new-password'}
                textContentType={mode === 'entrar' ? 'password' : 'newPassword'}
                onSubmitEditing={canSubmit ? submit : undefined}
                right={
                  <Pressable onPress={() => setShowPassword((s) => !s)} hitSlop={10}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textMuted}
                    />
                  </Pressable>
                }
              />
            )}

            {error && <Text style={styles.error}>{error}</Text>}
            {info && <Text style={styles.info}>{info}</Text>}

            <Button title={busy ? 'Aguarde...' : submitLabel} onPress={submit} disabled={!canSubmit} />

            {mode === 'entrar' && (
              <Pressable onPress={() => go('recuperar')} style={styles.linkWrap}>
                <Text style={styles.link}>Esqueci minha senha</Text>
              </Pressable>
            )}

            {mode === 'confirmar' && (
              <Pressable
                style={styles.linkWrap}
                disabled={busy}
                onPress={() =>
                  run(async () => {
                    await auth.resendConfirmation(email);
                    setInfo('Enviamos um novo código.');
                  })
                }>
                <Text style={styles.link}>Reenviar código</Text>
              </Pressable>
            )}

            {mode === 'confirmar' && (
              <Pressable
                style={styles.linkWrap}
                onPress={() => {
                  go('entrar');
                  setInfo('E-mail confirmado? Agora é só entrar com sua senha.');
                }}>
                <Text style={styles.footerText}>
                  Recebeu um link? Clique nele e depois <Text style={styles.link}>entre aqui</Text>
                </Text>
              </Pressable>
            )}

            {mode === 'nova-senha' && (
              <Pressable
                style={styles.linkWrap}
                disabled={busy}
                onPress={() =>
                  run(async () => {
                    await auth.sendPasswordReset(email);
                    setInfo('Enviamos um novo código.');
                  })
                }>
                <Text style={styles.link}>Reenviar código</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          {mode === 'entrar' ? (
            <Pressable onPress={() => go('criar')}>
              <Text style={styles.footerText}>
                Não tem conta? <Text style={styles.link}>Criar conta</Text>
              </Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => go('entrar')}>
              <Text style={styles.footerText}>
                {mode === 'criar' ? 'Já tem conta? ' : ''}
                <Text style={styles.link}>{mode === 'criar' ? 'Entrar' : 'Voltar para o login'}</Text>
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  icon,
  right,
  ...props
}: TextInputProps & { icon: keyof typeof Ionicons.glyphMap; right?: ReactNode }) {
  return (
    <View style={styles.field}>
      <Ionicons name={icon} size={20} color={colors.textMuted} />
      <TextInput style={styles.input} placeholderTextColor={colors.textFaint} {...props} />
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, maxWidth: 440, width: '100%', alignSelf: 'center' },
  poster: { marginTop: 28, alignItems: 'flex-start' },
  posterText: {
    color: colors.pena,
    fontSize: 56,
    lineHeight: 54,
    fontFamily: fonts.display,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  posterTag: {
    marginTop: 6,
    paddingHorizontal: 8,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: outlineColor,
    transform: [{ rotate: '-2deg' }],
  },
  posterTagText: { color: colors.primaryText },
  subtitle: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, marginTop: 14 },
  warning: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: colors.danger,
  },
  warningText: { color: colors.text, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, flex: 1 },
  formWrap: { marginTop: 56 },
  // A cabeça do Frank fica atrás do card, só o topo aparece por cima da borda.
  peek: { position: 'absolute', top: -44, right: 18 },
  form: {
    gap: 12,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: radius + 4,
    ...outline,
    ...hardShadow(colors.primary),
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.background,
    borderRadius: radius,
    ...outline,
  },
  input: { flex: 1, minWidth: 0, color: colors.text, fontFamily: fonts.regular, fontSize: 16, paddingVertical: 14 },
  error: { color: colors.danger, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  fieldHint: { fontFamily: fonts.semibold, fontSize: 13, marginTop: -4, paddingHorizontal: 4 },
  fieldError: { color: colors.danger, fontFamily: fonts.regular, fontSize: 13, marginTop: -4, paddingHorizontal: 4 },
  info: { color: colors.primary, fontFamily: fonts.regular, fontSize: 14 },
  linkWrap: { alignSelf: 'center', paddingVertical: 6 },
  link: { color: colors.primary, fontFamily: fonts.bold, fontSize: 14 },
  footer: { alignItems: 'center', marginTop: 28 },
  footerText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14 },
});
