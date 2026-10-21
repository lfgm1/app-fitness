import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FrankHead } from '@/components/Frank';
import { Button } from '@/components/ui';
import { authErrorMessage, useAuth } from '@/data/auth';
import { ageFrom, maskDate, parseBirthDate } from '@/lib/format';
import { isSupabaseConfigured } from '@/lib/supabase';
import { colors, fonts, outline, radius } from '@/theme';

const MIN_AGE = 13;

type Mode = 'entrar' | 'criar' | 'confirmar' | 'recuperar' | 'nova-senha';

const TITLES: Record<Mode, { title: string; subtitle: string }> = {
  entrar: { title: 'Entrar', subtitle: 'Seus treinos ficam salvos na sua conta, em qualquer celular.' },
  criar: { title: 'Criar conta', subtitle: 'Leva menos de um minuto.' },
  confirmar: { title: 'Confirme seu e-mail', subtitle: 'Enviamos um código para o seu e-mail.' },
  recuperar: { title: 'Recuperar senha', subtitle: 'Vamos enviar um código para o seu e-mail.' },
  'nova-senha': { title: 'Nova senha', subtitle: 'Digite o código que enviamos e escolha uma nova senha.' },
};

export function LoginScreen() {
  const auth = useAuth();
  const [mode, setMode] = useState<Mode>('entrar');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [birth, setBirth] = useState('');
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
  const validSignup = name.trim().length >= 2 && birthIso !== null && birthError === null;

  const submit = {
    entrar: () => run(() => auth.signIn(email, password)),
    criar: () =>
      run(async () => {
        const needsConfirmation = await auth.signUp(email, password, name, birthIso!);
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
        <View style={styles.brand}>
          <View style={styles.logo}>
            <FrankHead size={46} />
          </View>
          <Text style={styles.brandName}>
            Gains <Text style={{ color: colors.primary }}>Club</Text>
          </Text>
        </View>
        <Text style={styles.title}>{TITLES[mode].title}</Text>
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
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
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

        {(mode === 'entrar' || mode === 'criar') && (
          <>
            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.line} />
            </View>
            <Button
              title="Continuar com Google"
              icon="logo-google"
              variant="secondary"
              disabled={!isSupabaseConfigured || busy}
              onPress={() => run(auth.signInWithGoogle)}
            />
          </>
        )}

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
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28 },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: { color: colors.text, fontSize: 30, fontFamily: fonts.display, textTransform: 'uppercase', letterSpacing: 0.4 },
  title: { color: colors.text, fontSize: 38, fontFamily: fonts.display, textTransform: 'uppercase', letterSpacing: 0.4 },
  subtitle: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, marginTop: 6 },
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
  form: { gap: 12, marginTop: 28 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.card,
    borderRadius: radius,
    ...outline,
  },
  input: { flex: 1, minWidth: 0, color: colors.text, fontFamily: fonts.regular, fontSize: 16, paddingVertical: 14 },
  error: { color: colors.danger, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  fieldError: { color: colors.danger, fontFamily: fonts.regular, fontSize: 13, marginTop: -4, paddingHorizontal: 4 },
  info: { color: colors.primary, fontFamily: fonts.regular, fontSize: 14 },
  linkWrap: { alignSelf: 'center', paddingVertical: 6 },
  link: { color: colors.primary, fontFamily: fonts.bold, fontSize: 14 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textFaint, fontFamily: fonts.regular, fontSize: 13 },
  footer: { alignItems: 'center', marginTop: 28 },
  footerText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14 },
});
