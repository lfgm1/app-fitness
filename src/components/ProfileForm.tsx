import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

import { Button, SectionTitle } from '@/components/ui';
import { EXPERIENCE_HINTS, EXPERIENCE_LABELS, SEX_LABELS } from '@/data/profile';
import type { Experience, Profile, Sex } from '@/data/profile';
import { ageFrom, formatBirthDate, maskDate, parseBirthDate } from '@/lib/format';
import { kgToUnit, unitToKg } from '@/lib/units';
import { colors, fonts, outline, radius } from '@/theme';

const MIN_AGE = 13;
const STEP_GOALS = [5000, 10000, 15000];
const MIN_STEPS = 1000;
// Maior número que a coluna do banco (integer) consegue guardar.
const MAX_STEPS = 2147483647;
const CUSTOM = 'custom';

/** 10000 -> "10.000" */
function formatSteps(n: number) {
  return String(n).replace(/\B(?=(\d{3})+$)/g, '.');
}

const STEP_OPTIONS: Record<string, string> = {
  ...Object.fromEntries(STEP_GOALS.map((n) => [n, formatSteps(n)])),
  [CUSTOM]: 'Personalizar',
};

type Props = {
  initial: Profile;
  /** onboarding: logo após criar a conta (pode pular). edit: editar pelo menu da conta. */
  mode: 'onboarding' | 'edit';
  onSave: (profile: Profile) => Promise<void>;
  /** Perfil público: o @ (logo depois do Nome) e quem pode ver (no fim), salvos pelo mesmo botão. */
  extra?: {
    avatarElement: ReactNode;
    usernameElement: ReactNode;
    visibilityElement: ReactNode;
    problem: string | null;
    save: (name: string) => Promise<void>;
  };
};

export function ProfileForm({ initial, mode, onSave, extra }: Props) {
  const [name, setName] = useState(initial.name ?? '');
  const [birth, setBirth] = useState(initial.birthDate ? formatBirthDate(initial.birthDate) : '');
  const [sex, setSex] = useState<Sex | null>(initial.sex);
  const [height, setHeight] = useState(initial.heightCm ? String(initial.heightCm) : '');
  // O peso é digitado na unidade escolhida nas configurações (kg ou lb) e salvo em kg.
  const unit = initial.weightUnit;
  const [minWeight, maxWeight] = unit === 'kg' ? [30, 300] : [66, 661];
  const [weight, setWeight] = useState(initial.weightKg ? String(Math.round(kgToUnit(initial.weightKg, unit))) : '');
  const [experience, setExperience] = useState<Experience | null>(initial.experience);
  // Meta de passos: uma das opções prontas ou "custom" (valor digitado pela pessoa).
  const initialSteps = initial.dailyStepGoal;
  const initialIsPreset = initialSteps === null || STEP_GOALS.includes(initialSteps);
  const [stepChoice, setStepChoice] = useState<string | null>(
    initialSteps === null ? null : initialIsPreset ? String(initialSteps) : CUSTOM
  );
  const [customSteps, setCustomSteps] = useState(initialIsPreset ? '' : formatSteps(initialSteps!));
  const [stepsOpen, setStepsOpen] = useState(false);
  const stepsLabel =
    stepChoice === null
      ? 'Informe sua meta diária'
      : stepChoice === CUSTOM
        ? customSteps
          ? `${customSteps} passos`
          : 'Personalizar'
        : `${formatSteps(Number(stepChoice))} passos`;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): Profile | string {
    if (name.trim().length < 2) return 'Digite seu nome.';
    let birthDate: string | null = null;
    if (birth) {
      birthDate = parseBirthDate(birth);
      if (!birthDate || ageFrom(birthDate) > 110) return 'Data de nascimento inválida.';
      if (ageFrom(birthDate) < MIN_AGE) return `É preciso ter pelo menos ${MIN_AGE} anos.`;
    }
    const heightCm = height ? Number(height) : null;
    if (heightCm !== null && (heightCm < 100 || heightCm > 250)) return 'Altura deve estar entre 100 e 250 cm.';
    const weightValue = weight ? Number(weight) : null;
    if (weightValue !== null && (weightValue < minWeight || weightValue > maxWeight)) {
      return `Peso deve estar entre ${minWeight} e ${maxWeight} ${unit}.`;
    }
    const weightKg = weightValue === null ? null : Math.round(unitToKg(weightValue, unit) * 10) / 10;
    let dailyStepGoal: number | null = null;
    if (stepChoice === CUSTOM) {
      dailyStepGoal = Number(customSteps.replace(/\D/g, ''));
      if (!dailyStepGoal || dailyStepGoal < MIN_STEPS) {
        return `A meta de passos deve ser de pelo menos ${formatSteps(MIN_STEPS)}.`;
      }
      if (dailyStepGoal > MAX_STEPS) {
        return 'Esse valor é alto demais para a meta de passos.';
      }
    } else if (stepChoice !== null) {
      dailyStepGoal = Number(stepChoice);
    }
    return {
      ...initial,
      name: name.trim(),
      birthDate,
      sex,
      heightCm,
      weightKg,
      goal: initial.goal,
      experience,
      dailyStepGoal,
      onboardingCompleted: true,
    };
  }

  async function submit(skip = false) {
    setError(null);
    const result = skip ? { ...initial, onboardingCompleted: true } : validate();
    if (typeof result === 'string') {
      setError(result);
      return;
    }
    if (!skip && extra?.problem) {
      setError(extra.problem);
      return;
    }
    setBusy(true);
    try {
      // O perfil público primeiro: se o @ não puder ser usado, nada é salvo pela metade.
      if (!skip) await extra?.save(result.name ?? '');
      await onSave(result);
    } catch (e) {
      const message = (e as Error).message;
      setError(
        message.includes('@')
          ? message
          : 'Não foi possível salvar. Verifique sua conexão com a internet e tente de novo.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets>
      {mode === 'onboarding' && (
        <View style={{ gap: 6 }}>
          <Text style={styles.title}>Complete seu perfil</Text>
          <Text style={styles.subtitle}>
            Isso ajuda a personalizar suas metas. Leva menos de um minuto, e você pode alterar depois.
          </Text>
        </View>
      )}

      {extra?.avatarElement}
      <SectionTitle>Sobre você</SectionTitle>
      <Field value={name} onChangeText={setName} placeholder="Nome" autoCapitalize="words" maxLength={100} />
      {extra?.usernameElement}
      <Field
        value={birth}
        onChangeText={(v) => setBirth(maskDate(v))}
        placeholder="Data de nascimento (DD/MM/AAAA)"
        keyboardType="number-pad"
        maxLength={10}
      />
      <Choices options={SEX_LABELS} value={sex} onChange={setSex} />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Field
            value={height}
            onChangeText={(v) => setHeight(onlyDigits(v))}
            placeholder="Altura (cm) · opcional"
            keyboardType="number-pad"
            maxLength={3}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Field
            value={weight}
            onChangeText={(v) => setWeight(onlyDigits(v))}
            placeholder={`Peso (${unit}) · opcional`}
            keyboardType="number-pad"
            maxLength={3}
          />
        </View>
      </View>
      <Text style={styles.hint}>Altura e peso são opcionais: deixe em branco se não quiser informar.</Text>

      <SectionTitle>Experiência na academia</SectionTitle>
      <Choices
        options={EXPERIENCE_LABELS}
        descriptions={EXPERIENCE_HINTS}
        value={experience}
        onChange={setExperience}
      />

      <SectionTitle>Meta diária de passos</SectionTitle>
      <Pressable
        style={styles.select}
        onPress={() => setStepsOpen((open) => !open)}
        accessibilityRole="button"
        accessibilityLabel={`Meta diária de passos: ${stepsLabel}`}>
        <Ionicons name="footsteps-outline" size={20} color={colors.textMuted} />
        <Text style={[styles.selectText, stepChoice === null && { color: colors.textFaint }]}>{stepsLabel}</Text>
        <Ionicons name={stepsOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
      </Pressable>
      {stepsOpen && (
        <View style={styles.list}>
          {Object.entries(STEP_OPTIONS).map(([key, label], index) => {
            const selected = stepChoice === key;
            const custom = key === CUSTOM;
            return (
              <Pressable
                key={key}
                style={({ pressed }) => [
                  styles.listRow,
                  index > 0 && styles.listDivider,
                  pressed && styles.listPressed,
                ]}
                onPress={() => {
                  setStepChoice(key);
                  setStepsOpen(false);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.listText, selected && { color: colors.primary }]}>
                    {custom ? label : `${label} passos`}
                  </Text>
                  {custom && <Text style={styles.listHint}>Digite outro valor</Text>}
                </View>
                {selected ? (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                ) : (
                  custom && <Ionicons name="create-outline" size={18} color={colors.textMuted} />
                )}
              </Pressable>
            );
          })}
        </View>
      )}
      {stepChoice === CUSTOM && (
        <>
          <Field
            value={customSteps}
            onChangeText={(v) => setCustomSteps(v.replace(/\D/g, '') ? formatSteps(Number(v.replace(/\D/g, ''))) : '')}
            placeholder="Quantos passos por dia? Ex: 7.500"
            keyboardType="number-pad"
            maxLength={13}
            autoFocus={!customSteps}
          />
          <Text style={styles.hint}>Mínimo de {formatSteps(MIN_STEPS)} passos.</Text>
        </>
      )}

      {extra?.visibilityElement}

      {error && <Text style={styles.error}>{error}</Text>}

      <Button
        title={busy ? 'Salvando...' : mode === 'onboarding' ? 'Salvar e começar' : 'Salvar'}
        icon="checkmark"
        onPress={() => submit()}
        disabled={busy}
      />
      {mode === 'onboarding' && (
        <Button title="Pular por enquanto" variant="ghost" onPress={() => submit(true)} disabled={busy} />
      )}
    </ScrollView>
  );
}

/** Altura e peso aceitam só números inteiros. */
function onlyDigits(text: string) {
  return text.replace(/D/g, '');
}

function Field(props: TextInputProps) {
  return <TextInput style={styles.input} placeholderTextColor={colors.textFaint} {...props} />;
}

/** Opções em "pílulas"; tocar de novo na escolhida desmarca. */
function Choices<T extends string>({
  options,
  descriptions,
  value,
  onChange,
}: {
  options: Record<T, string>;
  /** Texto menor embaixo de cada opção (ex: tempo de treino). */
  descriptions?: Record<T, string>;
  value: T | null;
  onChange: (value: T | null) => void;
}) {
  return (
    <View style={styles.chips}>
      {(Object.keys(options) as T[]).map((key) => {
        const active = value === key;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(active ? null : key)}
            style={[styles.chip, descriptions && styles.chipWithDescription, active && styles.chipActive]}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{options[key]}</Text>
            {descriptions && (
              <Text style={[styles.chipDescription, active && styles.chipTextActive]}>{descriptions[key]}</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 40, maxWidth: 560, width: '100%', alignSelf: 'center' },
  title: {
    color: colors.text,
    fontSize: 33,
    fontFamily: fonts.display,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  subtitle: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  row: { flexDirection: 'row', gap: 10 },
  input: {
    backgroundColor: colors.card,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: radius,
    ...outline,
    minWidth: 0,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.card,
    ...outline,
  },
  chipWithDescription: { flex: 1, minWidth: 100, alignItems: 'center', borderRadius: 12, paddingVertical: 10, gap: 2 },
  chipDescription: { color: colors.textFaint, fontFamily: fonts.regular, fontSize: 12 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textMuted, fontFamily: fonts.semibold },
  chipTextActive: { color: colors.primaryText },
  error: { color: colors.danger, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: colors.card,
    borderRadius: radius,
    ...outline,
  },
  selectText: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 16 },
  list: {
    backgroundColor: colors.card,
    borderRadius: radius,
    ...outline,
    overflow: 'hidden',
  },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14 },
  listDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  listPressed: { backgroundColor: colors.cardAlt },
  listText: { color: colors.text, fontFamily: fonts.regular, fontSize: 16 },
  listHint: { color: colors.textFaint, fontFamily: fonts.regular, fontSize: 13, marginTop: 2 },
  hint: { color: colors.textFaint, fontFamily: fonts.regular, fontSize: 13, marginTop: -4, paddingHorizontal: 4 },
});
